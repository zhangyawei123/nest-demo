import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Browser, Page, launch } from 'puppeteer-core';
import { LessThan, Repository } from 'typeorm';
import { CreateJdProductDto } from './dto/create-jd-product.dto';
import { UpdateJdProductDto } from './dto/update-jd-product.dto';
import { JdNotificationService } from './jd-notification.service';
import { JdTrendProduct } from './jd-product.entity';
import { JdTrendReport } from './jd-report.entity';
import { JdTrendSnapshot } from './jd-snapshot.entity';

type CookieStatus =
  | 'valid'
  | 'expired'
  | 'risk_control'
  | 'missing'
  | 'not_checked'
  | 'check_failed';

type PageFields = {
  title: string;
  priceText: string;
  commentText: string;
  shop: string;
  stockText: string;
  bodyText: string;
};

@Injectable()
export class JdTrendService {
  private readonly logger = new Logger(JdTrendService.name);
  private collecting = false;
  private lastCookieAlertDate = '';

  constructor(
    @InjectRepository(JdTrendProduct)
    private readonly productRepository: Repository<JdTrendProduct>,
    @InjectRepository(JdTrendSnapshot)
    private readonly snapshotRepository: Repository<JdTrendSnapshot>,
    @InjectRepository(JdTrendReport)
    private readonly reportRepository: Repository<JdTrendReport>,
    private readonly configService: ConfigService,
    private readonly notificationService: JdNotificationService,
  ) {}

  async listProducts(): Promise<JdTrendProduct[]> {
    return this.productRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createProduct(dto: CreateJdProductDto): Promise<JdTrendProduct> {
    const { sku, url } = this.normalizeProduct(dto.value);
    const existing = await this.productRepository.findOne({ where: { sku } });
    if (existing) {
      throw new ConflictException(`SKU ${sku} 已在监控列表中`);
    }
    return this.productRepository.save(
      this.productRepository.create({
        sku,
        url,
        name: dto.name?.trim() || null,
        enabled: true,
      }),
    );
  }

  async updateProduct(
    id: number,
    dto: UpdateJdProductDto,
  ): Promise<JdTrendProduct> {
    const product = await this.getProduct(id);
    if (dto.name !== undefined) product.name = dto.name.trim() || null;
    if (dto.enabled !== undefined) product.enabled = dto.enabled;
    return this.productRepository.save(product);
  }

  async removeProduct(id: number): Promise<{ deleted: boolean }> {
    const product = await this.getProduct(id);
    await this.productRepository.remove(product);
    return { deleted: true };
  }

  async listReports(limit = 30) {
    const reports = await this.reportRepository.find({
      order: { reportDate: 'DESC' },
      take: Math.min(Math.max(limit, 1), 100),
    });
    return reports.map((report) => this.toReportResponse(report));
  }

  async getLatestReport() {
    const report = await this.reportRepository.findOne({
      where: {},
      order: { reportDate: 'DESC' },
    });
    return report ? this.toReportResponse(report) : null;
  }

  async getReport(reportDate: string) {
    const report = await this.reportRepository.findOne({
      where: { reportDate },
    });
    if (!report) throw new NotFoundException(`${reportDate} 没有趋势报告`);
    return this.toReportResponse(report);
  }

  getConfigurationStatus() {
    return {
      cookieConfigured: Boolean(this.readCookieHeader()),
      browserExecutable: this.findBrowserExecutable() || null,
      collectionSchedule: this.collectionSchedule(),
      reportTime: `${String(this.reportHour()).padStart(2, '0')}:00`,
      timeZone: 'Asia/Shanghai',
      pacingSeconds: `${this.baseDelaySeconds()}-${this.baseDelaySeconds() + this.jitterSeconds()}`,
      riskCooldownUntil: this.riskCooldownUntil()?.toISOString() || null,
      ...this.notificationService.getStatus(),
    };
  }

  async collectToday(
    options: { collectionSlot?: string; notifyReport?: boolean } = {},
  ) {
    if (this.collecting) {
      throw new ConflictException('采集任务正在运行，请稍后再试');
    }

    this.collecting = true;
    let browser: Browser | null = null;
    try {
      const cooldownUntil = this.riskCooldownUntil();
      if (cooldownUntil) {
        throw new ConflictException(
          `京东安全验证冷却中，${this.formatShanghaiDateTime(cooldownUntil)} 后再采集`,
        );
      }

      const reportDate = this.shanghaiDate();
      const collectionSlot =
        options.collectionSlot || this.currentCollectionSlot();
      const products = await this.productRepository.find({
        where: { enabled: true },
        order: { id: 'ASC' },
      });

      if (products.length === 0) {
        const cookieStatus = this.readCookieHeader()
          ? 'not_checked'
          : 'missing';
        return this.saveReport(reportDate, collectionSlot, cookieStatus, []);
      }

      const executablePath = this.findBrowserExecutable();
      if (!executablePath) {
        throw new BadRequestException(
          '没有找到 Chrome/Chromium，请设置 JD_CHROME_EXECUTABLE',
        );
      }

      browser = await launch({
        executablePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--lang=zh-CN',
        ],
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 1000 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      );
      page.setDefaultNavigationTimeout(this.timeoutMilliseconds());

      const cookieHeader = this.readCookieHeader();
      if (cookieHeader) {
        const cookies = this.parseCookieHeader(cookieHeader);
        if (cookies.length) await page.setCookie(...cookies);
      }

      let cookieStatus: CookieStatus = cookieHeader ? 'not_checked' : 'missing';

      const snapshots: JdTrendSnapshot[] = [];
      for (const product of products) {
        if (snapshots.length > 0) {
          await this.pacedPause(`准备采集 SKU ${product.sku}`);
        }
        const snapshot = await this.collectProduct(
          page,
          product,
          reportDate,
          collectionSlot.slice(-2),
        );
        snapshots.push(await this.saveSnapshot(snapshot));
        if (snapshot.pageStatus === 'login_required') {
          cookieStatus = 'expired';
          await this.alertCookieOncePerDay(cookieStatus, reportDate);
          break;
        }
        if (snapshot.pageStatus === 'risk_control') {
          cookieStatus = 'risk_control';
          this.startRiskCooldown();
          await this.alertCookieOncePerDay(cookieStatus, reportDate);
          break;
        }
        if (cookieHeader) cookieStatus = 'valid';
      }

      const report = await this.saveReport(
        reportDate,
        collectionSlot,
        cookieStatus,
        snapshots,
      );
      if (options.notifyReport !== false) {
        await this.notificationService.sendReport(report);
      }
      return report;
    } finally {
      if (browser) await browser.close();
      this.collecting = false;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, { timeZone: 'Asia/Shanghai' })
  async runIntervalCollection(): Promise<void> {
    const now = this.shanghaiParts();
    if (this.collecting || this.riskCooldownUntil()) return;

    const slotHour =
      Math.floor(now.hour / this.intervalHours()) * this.intervalHours();
    const collectionSlot = `${now.date}-${String(slotHour).padStart(2, '0')}`;

    const existing = await this.reportRepository.findOne({
      where: { reportDate: now.date },
    });
    if (existing?.collectionSlot === collectionSlot) return;

    try {
      await this.collectToday({
        collectionSlot,
        notifyReport: slotHour === this.reportHour(),
      });
    } catch (error) {
      this.logger.error(
        `定时采集失败：${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async collectProduct(
    page: Page,
    product: JdTrendProduct,
    reportDate: string,
    snapshotSlot: string,
  ): Promise<JdTrendSnapshot> {
    const snapshot = this.snapshotRepository.create({
      productId: product.id,
      sku: product.sku,
      snapshotDate: reportDate,
      snapshotSlot,
      capturedAt: new Date(),
      productUrl: product.url,
      title: product.name || '',
      price: null,
      commentCount: null,
      shop: '',
      stockText: '',
      rankName: '',
      rankPosition: null,
      rankText: '',
      pageStatus: 'ok',
      error: '',
    });

    try {
      await page.goto(product.url, { waitUntil: 'domcontentloaded' });
      await this.pacedPause(`等待 SKU ${product.sku} 页面稳定`);
      const fields = (await page.evaluate(() => {
        const firstText = (selectors: string[]) => {
          for (const selector of selectors) {
            const nodes = Array.from(document.querySelectorAll(selector));
            for (const node of nodes) {
              const text = node.textContent?.replace(/\s+/g, ' ').trim();
              if (text) return text;
            }
          }
          return '';
        };
        return {
          title: firstText([
            'div.sku-name',
            '.sku-name',
            '#name h1',
            'main h1',
            'h1',
          ]),
          priceText: firstText([
            '.summary-price .p-price .price',
            '.p-price .price',
            '[data-price]',
          ]),
          commentText: firstText([
            '#comment-count .count',
            '.comment-count .count',
            "a[href*='#comment']",
          ]),
          shop: firstText([
            '.J-hove-wrap .name a',
            '.popbox .mt h3 a',
            '.shop-name a',
            '.shopName',
          ]),
          stockText: firstText([
            '#store-prompt',
            '.store-prompt',
            '.stock-state',
            '.delivery-promise',
          ]),
          bodyText: document.body?.innerText || '',
        };
      })) as PageFields;

      snapshot.pageStatus = this.pageProblemStatus(fields.bodyText, page.url());
      if (snapshot.pageStatus !== 'ok') {
        snapshot.error = `页面状态：${snapshot.pageStatus}`;
        return snapshot;
      }

      snapshot.title = fields.title || this.cleanTitle(await page.title());
      snapshot.price = this.parsePrice(fields.priceText);
      snapshot.commentCount = this.parseCount(fields.commentText);
      snapshot.shop = fields.shop;
      snapshot.stockText = fields.stockText;
      const rank = this.extractRank(fields.bodyText);
      snapshot.rankName = rank.rankName;
      snapshot.rankPosition = rank.rankPosition;
      snapshot.rankText = rank.rankText;

      if (!product.name && snapshot.title) {
        product.name = snapshot.title;
        await this.productRepository.save(product);
      }
    } catch (error) {
      snapshot.pageStatus = 'error';
      snapshot.error = (
        error instanceof Error ? error.message : String(error)
      ).slice(0, 1000);
    }
    return snapshot;
  }

  private async saveReport(
    reportDate: string,
    collectionSlot: string,
    cookieStatus: CookieStatus,
    snapshots: JdTrendSnapshot[],
  ) {
    const items: Array<Record<string, any>> = [];
    for (const current of snapshots) {
      const previous = await this.snapshotRepository.findOne({
        where: { sku: current.sku, capturedAt: LessThan(current.capturedAt) },
        order: { capturedAt: 'DESC' },
      });
      const daySnapshots = await this.snapshotRepository.find({
        where: { sku: current.sku, snapshotDate: reportDate },
        order: { capturedAt: 'ASC' },
      });
      const dayPrices = daySnapshots
        .map((snapshot) => snapshot.price)
        .filter((price): price is number => price !== null);
      items.push({
        ...current,
        previousDate: previous?.snapshotDate || null,
        previousPrice: previous?.price ?? null,
        priceChange: this.change(current.price, previous?.price),
        previousCommentCount: previous?.commentCount ?? null,
        commentChange: this.change(
          current.commentCount,
          previous?.commentCount,
        ),
        previousRankPosition: previous?.rankPosition ?? null,
        rankChange:
          current.rankPosition !== null && previous?.rankPosition != null
            ? previous.rankPosition - current.rankPosition
            : null,
        sampleCount: daySnapshots.length,
        dailyMinPrice: dayPrices.length ? Math.min(...dayPrices) : null,
        dailyMaxPrice: dayPrices.length ? Math.max(...dayPrices) : null,
      });
    }

    const successCount = snapshots.filter(
      (snapshot) => snapshot.pageStatus === 'ok',
    ).length;
    const status =
      snapshots.length === 0
        ? 'empty'
        : successCount === snapshots.length
          ? 'complete'
          : successCount === 0
            ? 'failed'
            : 'partial';
    const summary = this.buildSummary(items);
    const reportData = JSON.stringify({ summary, items });
    const currentReport = await this.reportRepository.findOne({
      where: { reportDate },
    });
    const saved = await this.reportRepository.save(
      this.reportRepository.create({
        ...currentReport,
        reportDate,
        status,
        productCount: snapshots.length,
        successCount,
        cookieStatus,
        collectionSlot,
        reportData,
      }),
    );
    return this.toReportResponse(saved);
  }

  private async saveSnapshot(
    snapshot: JdTrendSnapshot,
  ): Promise<JdTrendSnapshot> {
    const current = await this.snapshotRepository.findOne({
      where: {
        sku: snapshot.sku,
        snapshotDate: snapshot.snapshotDate,
        snapshotSlot: snapshot.snapshotSlot,
      },
    });
    if (current) {
      snapshot.id = current.id;
      snapshot.createdAt = current.createdAt;
    }
    return this.snapshotRepository.save(snapshot);
  }

  private buildSummary(items: Array<Record<string, any>>) {
    const risingComments = items
      .filter((item) => (item.commentChange ?? 0) > 0)
      .sort((a, b) => (b.commentChange ?? 0) - (a.commentChange ?? 0));
    const priceDrops = items
      .filter((item) => (item.priceChange ?? 0) < 0)
      .sort((a, b) => (a.priceChange ?? 0) - (b.priceChange ?? 0));
    const rankRises = items
      .filter((item) => (item.rankChange ?? 0) > 0)
      .sort((a, b) => (b.rankChange ?? 0) - (a.rankChange ?? 0));
    return {
      message:
        items.length === 0
          ? '监控列表为空，请先添加京东商品链接或 SKU。'
          : '评价增量、价格和榜单名次来自公开页面，只表示趋势，不等同于真实成交量。',
      topCommentGrowth: risingComments.slice(0, 5),
      topPriceDrops: priceDrops.slice(0, 5),
      topRankGrowth: rankRises.slice(0, 5),
    };
  }

  private toReportResponse(report: JdTrendReport) {
    const parsed = JSON.parse(report.reportData) as {
      summary: Record<string, unknown>;
      items: Array<Record<string, unknown>>;
    };
    return {
      id: report.id,
      reportDate: report.reportDate,
      status: report.status,
      productCount: report.productCount,
      successCount: report.successCount,
      cookieStatus: report.cookieStatus,
      collectionSlot: report.collectionSlot,
      summary: parsed.summary,
      items: parsed.items,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  private async getProduct(id: number): Promise<JdTrendProduct> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('监控商品不存在');
    return product;
  }

  private normalizeProduct(value: string): { sku: string; url: string } {
    const input = value.trim();
    const match = input.match(/item\.jd\.com\/(\d+)\.html/i);
    const sku = /^\d+$/.test(input) ? input : match?.[1];
    if (!sku) {
      throw new BadRequestException('请输入京东商品链接或纯数字 SKU');
    }
    return { sku, url: `https://item.jd.com/${sku}.html` };
  }

  private parseCookieHeader(cookieHeader: string) {
    return cookieHeader
      .replace(/^\s*cookie\s*:\s*/i, '')
      .replace(/[\r\n]/g, ' ')
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.includes('='))
      .map((part) => {
        const separator = part.indexOf('=');
        return {
          name: part.slice(0, separator).trim(),
          value: part.slice(separator + 1).trim(),
          domain: '.jd.com',
          path: '/',
          secure: true,
        };
      })
      .filter((cookie) => cookie.name);
  }

  private readCookieHeader(): string {
    const envCookie = this.configService.get<string>('JD_COOKIE', '').trim();
    if (envCookie) return envCookie;

    const configuredPath = this.configService.get<string>(
      'JD_COOKIE_FILE',
      '.jd_cookie.txt',
    );
    const cookiePath = resolve(process.cwd(), configuredPath);
    if (!existsSync(cookiePath)) return '';
    return readFileSync(cookiePath, 'utf8').trim();
  }

  private findBrowserExecutable(): string {
    const configured = this.configService.get<string>('JD_CHROME_EXECUTABLE');
    const candidates = [
      configured,
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    ].filter((value): value is string => Boolean(value));
    return candidates.find((candidate) => existsSync(candidate)) || '';
  }

  private pageProblemStatus(bodyText: string, currentUrl: string): string {
    if (/passport\.jd\.com|login\.jd\.com/.test(currentUrl)) {
      return 'login_required';
    }
    if (
      /验证一下|安全验证|访问过于频繁|请完成验证/.test(bodyText) ||
      /safe\.jd\.com|captcha|risk/.test(currentUrl)
    ) {
      return 'risk_control';
    }
    if (/商品已下柜|商品已下架|商品找不到了/.test(bodyText)) {
      return 'unavailable';
    }
    return 'ok';
  }

  private parsePrice(value: string): number | null {
    const match = value.replace(/,/g, '').match(/([0-9]+(?:\.[0-9]{1,2})?)/);
    return match ? Number(match[1]) : null;
  }

  private parseCount(value: string): number | null {
    const match = value.replace(/,/g, '').match(/([\d.]+)\s*(万)?/);
    if (!match) return null;
    const count = Number(match[1]) * (match[2] ? 10000 : 1);
    return Math.round(count);
  }

  private extractRank(bodyText: string) {
    const patterns = [
      /([^\n。]{2,45}(?:热卖榜|排行榜))\s*(?:第)?\s*(\d+)\s*名/,
      /位列\s*([^\n。]{2,45}榜)\s*(?:第)?\s*(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = bodyText.match(pattern);
      if (match) {
        return {
          rankName: match[1].replace(/\s+/g, ' ').trim(),
          rankPosition: Number(match[2]),
          rankText: match[0].replace(/\s+/g, ' ').trim(),
        };
      }
    }
    return { rankName: '', rankPosition: null, rankText: '' };
  }

  private change(
    current: number | null,
    previous: number | null | undefined,
  ): number | null {
    return current !== null && previous !== null && previous !== undefined
      ? Number((current - previous).toFixed(2))
      : null;
  }

  private cleanTitle(title: string): string {
    return title.replace(/\s*-\s*京东.*$/, '').trim();
  }

  private async pacedPause(reason: string): Promise<void> {
    const seconds =
      this.baseDelaySeconds() + Math.random() * this.jitterSeconds();
    this.logger.log(`${reason}，等待 ${seconds.toFixed(1)} 秒`);
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }

  private baseDelaySeconds(): number {
    return Math.max(
      12,
      Number(this.configService.get<string>('JD_TREND_DELAY_SECONDS', '12')) ||
        12,
    );
  }

  private jitterSeconds(): number {
    return Math.max(
      18,
      Number(this.configService.get<string>('JD_TREND_JITTER_SECONDS', '18')) ||
        18,
    );
  }

  private riskCooldownUntil(): Date | null {
    const path = this.riskCooldownPath();
    if (!existsSync(path)) return null;
    const until = new Date(readFileSync(path, 'utf8').trim());
    if (!Number.isNaN(until.getTime()) && until.getTime() > Date.now()) {
      return until;
    }
    unlinkSync(path);
    return null;
  }

  private startRiskCooldown(): void {
    const hours = Math.max(
      1,
      Number(
        this.configService.get<string>('JD_TREND_RISK_COOLDOWN_HOURS', '24'),
      ) || 24,
    );
    const until = new Date(Date.now() + hours * 60 * 60 * 1000);
    writeFileSync(this.riskCooldownPath(), until.toISOString(), {
      mode: 0o600,
    });
    this.logger.warn(
      `检测到京东安全验证，暂停采集至 ${this.formatShanghaiDateTime(until)}`,
    );
  }

  private riskCooldownPath(): string {
    return resolve(process.cwd(), '.jd_trend_risk_cooldown');
  }

  private formatShanghaiDateTime(value: Date): string {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(value);
  }

  private timeoutMilliseconds(): number {
    return Math.max(
      10000,
      Number(this.configService.get<string>('JD_TREND_TIMEOUT_MS', '45000')) ||
        45000,
    );
  }

  private intervalHours(): number {
    const configured = Number(
      this.configService.get<string>('JD_TREND_INTERVAL_HOURS', '6'),
    );
    return [1, 2, 3, 4, 6, 8, 12, 24].includes(configured) ? configured : 6;
  }

  private reportHour(): number {
    const configured = Number(
      this.configService.get<string>('JD_TREND_REPORT_HOUR', '18'),
    );
    return Number.isInteger(configured) && configured >= 0 && configured <= 23
      ? configured
      : 18;
  }

  private collectionSchedule(): string[] {
    const hours: string[] = [];
    for (let hour = 0; hour < 24; hour += this.intervalHours()) {
      hours.push(`${String(hour).padStart(2, '0')}:00`);
    }
    return hours;
  }

  private currentCollectionSlot(): string {
    const now = this.shanghaiParts();
    const slotHour =
      Math.floor(now.hour / this.intervalHours()) * this.intervalHours();
    return `${now.date}-${String(slotHour).padStart(2, '0')}`;
  }

  private shanghaiDate(): string {
    return this.shanghaiParts().date;
  }

  private shanghaiParts(): { date: string; hour: number; minute: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (type: string) =>
      parts.find((part) => part.type === type)?.value || '';
    return {
      date: `${get('year')}-${get('month')}-${get('day')}`,
      hour: Number(get('hour')),
      minute: Number(get('minute')),
    };
  }

  private async alertCookieOncePerDay(
    cookieStatus: CookieStatus,
    reportDate: string,
  ): Promise<void> {
    if (this.lastCookieAlertDate === reportDate) return;
    this.lastCookieAlertDate = reportDate;
    await this.notificationService.sendCookieAlert(cookieStatus);
  }
}
