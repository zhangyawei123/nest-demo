import {
  BadGatewayException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname, join, normalize } from 'path';
import { Repository } from 'typeorm';
import {
  CreateDrawGenerationDto,
  QueryDrawGenerationHistoryDto,
} from './draw.dto';
import { DrawGeneration } from './draw-generation.entity';
import { POINT_COSTS, PointsService } from '../points/points.service';

interface DrawApiResponse {
  created?: number;
  data?: Array<{
    url?: string;
    thumbnail_url?: string;
    b64_json?: string;
    [key: string]: unknown;
  }>;
  images?: unknown[];
  urls?: unknown[];
  result?: unknown;
  results?: unknown[];
  usage?: Record<string, unknown>;
  message?: unknown;
  error?: unknown;
  [key: string]: unknown;
}

interface GeneratedImageItem {
  url?: string;
  thumbnail_url?: string;
  b64_json?: string;
  [key: string]: unknown;
}

interface ReferenceImageFile {
  buffer: Buffer;
  filename: string;
  mime: string;
}

@Injectable()
export class DrawService {
  private readonly maxPersistImageSize = 20 * 1024 * 1024;
  private readonly drawPollIntervalMs = 5000;
  private readonly drawPollMaxAttempts = 24;
  private readonly imageMimeExtensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
  };

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(DrawGeneration)
    private readonly drawGenerationRepo: Repository<DrawGeneration>,
    private readonly pointsService: PointsService,
  ) {}

  async generate(userId: number, dto: CreateDrawGenerationDto) {
    if (!userId) {
      throw new ServiceUnavailableException('用户身份无效');
    }

    const baseUrl = this.configService.get<string>(
      'DRAW_BASE_URL',
      'https://tupian.kklt.lol',
    );
    const apiKey = this.configService.get<string>('DRAW_API_KEY', '');
    const model =
      dto.model || this.configService.get<string>('DRAW_MODEL', 'draw-image');
    const generationApiPath = this.configService.get<string>(
      'DRAW_GENERATION_API_PATH',
      this.configService.get<string>('DRAW_API_PATH', '/api/draw/generations'),
    );
    const editApiPath = this.configService.get<string>(
      'DRAW_EDIT_API_PATH',
      '/api/draw/edits',
    );
    const historyApiPath = this.configService.get<string>(
      'DRAW_HISTORY_API_PATH',
      '/api/draw/history',
    );
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL', '');

    if (!apiKey) {
      throw new ServiceUnavailableException('未配置生图服务密钥');
    }

    const rawImages = dto.image || [];
    const hasReferenceImage = rawImages.some(
      (image) => typeof image === 'string' && image.trim(),
    );
    const count = this.normalizeCount(dto.count);
    const size = this.normalizeDrawSize(dto.size);
    const resolution = this.normalizeResolution(dto.resolution);
    const requestBody = {
      model,
      prompt: dto.prompt,
      image: rawImages,
      count,
      size,
      resolution,
      response_format: dto.response_format || 'url',
    };

    let record: DrawGeneration;

    try {
      record = await this.drawGenerationRepo.save(
        this.drawGenerationRepo.create({
          userId,
          model: requestBody.model,
          prompt: requestBody.prompt,
          image: rawImages,
          size: requestBody.size,
          responseFormat: requestBody.response_format,
          status: 'pending',
          requestBody,
          responseBody: null,
          generatedUrls: null,
          errorMessage: null,
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '创建生图记录失败';
      throw new ServiceUnavailableException(`数据库操作失败: ${message}`);
    }

    try {
      await this.pointsService.spend(userId, POINT_COSTS.DRAW_GENERATION, {
        scene: 'draw_generation',
        description: 'AI 生图',
        refType: 'draw_generation',
        refId: record.id,
      });
    } catch (error) {
      await this.markRecordFailed(record, error);
      throw error;
    }

    void this.runGenerationTask({
      recordId: record.id,
      userId,
      requestBody,
      baseUrl,
      generationApiPath,
      editApiPath,
      historyApiPath,
      publicBaseUrl,
      hasReferenceImage,
      apiKey,
    });

    return {
      id: record.id,
      status: 'pending',
      data: [],
      message: '任务已提交，图片生成中',
    };
  }

  private async runGenerationTask(params: {
    recordId: number;
    userId: number;
    requestBody: Record<string, unknown>;
    baseUrl: string;
    generationApiPath: string;
    editApiPath: string;
    historyApiPath: string;
    publicBaseUrl: string;
    hasReferenceImage: boolean;
    apiKey: string;
  }) {
    let record: DrawGeneration | null = null;

    try {
      record = await this.drawGenerationRepo.findOne({
        where: { id: params.recordId },
      });
      if (!record) return;

      const normalizedBaseUrl = params.baseUrl.replace(/\/$/, '');
      const apiPath = params.hasReferenceImage
        ? params.editApiPath
        : params.generationApiPath;
      const normalizedApiPath = this.normalizeApiPath(apiPath);
      const res = params.hasReferenceImage
        ? await this.requestImageEdit(
            `${normalizedBaseUrl}${normalizedApiPath}`,
            params.apiKey,
            params.requestBody,
            params.publicBaseUrl,
          )
        : await this.requestImageGeneration(
            `${normalizedBaseUrl}${normalizedApiPath}`,
            params.apiKey,
            params.requestBody,
          );

      const text = await res.text();
      let responseBody: DrawApiResponse;

      try {
        responseBody = text ? JSON.parse(text) : {};
      } catch {
        responseBody = { raw: text };
      }

      if (!res.ok) {
        const upstreamMessage = this.extractUpstreamMessage(responseBody);
        const errorMessage = upstreamMessage
          ? `生图服务请求失败 (${res.status}): ${upstreamMessage}`
          : `生图服务请求失败 (${res.status})`;
        record.status = 'failed';
        record.responseBody = responseBody as Record<string, unknown>;
        record.errorMessage = errorMessage;
        await this.drawGenerationRepo.save(record);
        throw new BadGatewayException(errorMessage);
      }

      let persisted = await this.persistGeneratedImages(
        responseBody,
        params.publicBaseUrl,
        normalizedBaseUrl,
      );

      if (!persisted.generatedUrls.length) {
        const polled = await this.pollGeneratedImages(
          responseBody,
          `${normalizedBaseUrl}${this.normalizeApiPath(params.historyApiPath)}`,
          params.apiKey,
          params.publicBaseUrl,
        );
        if (polled) {
          persisted = polled;
        }
      }

      record.status = persisted.generatedUrls.length ? 'success' : 'pending';
      record.responseBody = persisted.responseBody as Record<string, unknown>;
      record.generatedUrls = persisted.generatedUrls;
      record.errorMessage = null;
      await this.drawGenerationRepo.save(record);
    } catch (error) {
      if (record) {
        await this.markRecordFailed(record, error);
        await this.refundDrawPoints(params.userId, record.id).catch(() => null);
      }
    }
  }

  private async markRecordFailed(record: DrawGeneration, error: unknown) {
    record.status = 'failed';
    record.errorMessage = this.extractErrorMessage(error);
    await this.drawGenerationRepo.save(record);
  }

  private extractErrorMessage(error: unknown) {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      const message = (response as any)?.message;
      return Array.isArray(message) ? message[0] : message || error.message;
    }

    return error instanceof Error ? error.message : '生图服务请求异常';
  }

  private refundDrawPoints(userId: number, recordId: number) {
    return this.pointsService.refund(userId, POINT_COSTS.DRAW_GENERATION, {
      scene: 'draw_generation_refund',
      description: 'AI 生图失败退回',
      refType: 'draw_generation',
      refId: recordId,
    });
  }

  async findHistory(userId: number, query: QueryDrawGenerationHistoryDto) {
    if (!userId) {
      throw new ServiceUnavailableException('用户身份无效');
    }

    await this.refreshPendingRecords(userId);

    const page = this.normalizePositiveInteger(query.page, 1);
    const pageSize = Math.min(
      this.normalizePositiveInteger(query.pageSize, 20),
      100,
    );
    const keyword = query.keyword?.trim();

    const qb = this.drawGenerationRepo
      .createQueryBuilder('generation')
      .where('generation.userId = :userId', { userId })
      .orderBy('generation.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (query.status) {
      qb.andWhere('generation.status = :status', { status: query.status });
    }

    if (keyword) {
      qb.andWhere(
        '(generation.prompt LIKE :keyword OR generation.model LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const [list, total] = await qb.getManyAndCount();

    return {
      list: list.map((record) => this.serializeRecord(record)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(userId: number, id: number) {
    if (!userId) {
      throw new ServiceUnavailableException('用户身份无效');
    }

    if (!id || Number.isNaN(id)) {
      throw new NotFoundException('生图记录不存在');
    }

    const record = await this.drawGenerationRepo.findOne({
      where: { id, userId },
    });
    if (!record) {
      throw new NotFoundException('生图记录不存在');
    }

    return this.serializeRecord(record, true);
  }

  private normalizeImageUrls(images: unknown[], publicBaseUrl: string) {
    return images.map((image) => {
      if (typeof image !== 'string') {
        return image;
      }

      if (/^(https?:|data:)/i.test(image)) {
        return image;
      }

      if (!image.startsWith('/')) {
        return image;
      }

      const normalizedBaseUrl = publicBaseUrl.replace(/\/$/, '');
      return normalizedBaseUrl ? `${normalizedBaseUrl}${image}` : image;
    });
  }

  private async persistGeneratedImages(
    responseBody: DrawApiResponse,
    publicBaseUrl: string,
    upstreamBaseUrl: string,
  ) {
    const generatedItems = this.extractGeneratedImageItems(
      responseBody,
      upstreamBaseUrl,
    );

    if (!generatedItems.length) {
      return {
        responseBody,
        generatedUrls: [] as string[],
      };
    }

    const data = await Promise.all(
      generatedItems.map(async (item, index) => {
        const saved = await this.persistGeneratedImageItem(
          item,
          index,
          publicBaseUrl,
        );
        const nextItem: Record<string, unknown> = {
          ...item,
          url: saved.publicUrl,
        };

        if (item.url && item.url !== saved.publicUrl) {
          nextItem.upstream_url = item.url;
        }
        if (item.b64_json) {
          nextItem.has_b64_json = true;
          delete nextItem.b64_json;
        }

        return nextItem;
      }),
    );

    return {
      responseBody: {
        ...responseBody,
        data,
      },
      generatedUrls: data
        .map((item) => item.url)
        .filter((url): url is string => typeof url === 'string' && !!url),
    };
  }

  private async persistGeneratedImageItem(
    item: GeneratedImageItem,
    index: number,
    publicBaseUrl: string,
  ) {
    const image = await this.readGeneratedImage(item);
    if (image.buffer.length > this.maxPersistImageSize) {
      throw new BadGatewayException(
        `第 ${index + 1} 张图片超过 ${this.maxPersistImageSize / 1024 / 1024}MB，无法保存`,
      );
    }

    const filename = `${randomUUID()}${image.extension}`;
    const relativeUrl = `/uploads/draw/${filename}`;
    const uploadDir = join(process.cwd(), 'uploads', 'draw');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), image.buffer);

    const normalizedBaseUrl = publicBaseUrl.replace(/\/$/, '');
    return {
      relativeUrl,
      publicUrl: normalizedBaseUrl
        ? `${normalizedBaseUrl}${relativeUrl}`
        : relativeUrl,
    };
  }

  private async readGeneratedImage(item: GeneratedImageItem) {
    if (item.b64_json) {
      return {
        buffer: Buffer.from(item.b64_json, 'base64'),
        extension: '.png',
      };
    }

    const url = item.url;
    if (!url) {
      throw new BadGatewayException('生图服务未返回图片地址');
    }

    const dataUrlMatch = url.match(/^data:(image\/[\w.+-]+);base64,(.+)$/i);
    if (dataUrlMatch) {
      const mime = dataUrlMatch[1].toLowerCase();
      return {
        buffer: Buffer.from(dataUrlMatch[2], 'base64'),
        extension: this.extensionFromMime(mime) || '.png',
      };
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new BadGatewayException(`保存生图结果失败 (${res.status})`);
    }

    const contentType =
      res.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || '';
    const buffer = Buffer.from(await res.arrayBuffer());

    return {
      buffer,
      extension:
        this.extensionFromMime(contentType) ||
        this.extensionFromUrl(url) ||
        '.png',
    };
  }

  private extensionFromMime(mime: string) {
    return this.imageMimeExtensions[mime] || '';
  }

  private extensionFromUrl(url: string) {
    try {
      const pathname = new URL(url).pathname;
      const ext = extname(pathname).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
        ? ext
        : '';
    } catch {
      return '';
    }
  }

  private normalizePositiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return fallback;
    }
    return parsed;
  }

  private normalizeCount(value: unknown) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return 1;
    return Math.min(Math.max(parsed, 1), 5);
  }

  private normalizeResolution(value: unknown) {
    return value === '2K' || value === '4K' ? value : undefined;
  }

  private normalizeDrawSize(value: unknown) {
    if (typeof value !== 'string') return '1:1';
    const size = value.trim();
    if (['1:1', '16:9', '9:16', '4:3', '3:4'].includes(size)) {
      return size;
    }

    const legacyMap: Record<string, string> = {
      '1024x1024': '1:1',
      '1024*1024': '1:1',
      '1792x1024': '16:9',
      '1024x1792': '9:16',
    };
    return legacyMap[size.toLowerCase()] || '1:1';
  }

  private normalizeApiPath(apiPath: string) {
    return apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  }

  private async pollGeneratedImages(
    initialResponseBody: DrawApiResponse,
    historyUrl: string,
    apiKey: string,
    publicBaseUrl: string,
  ) {
    const taskId = this.extractTaskId(initialResponseBody);
    if (!taskId && !this.isProcessingResponse(initialResponseBody)) {
      return null;
    }

    for (let attempt = 0; attempt < this.drawPollMaxAttempts; attempt += 1) {
      await this.sleep(this.drawPollIntervalMs);
      const historyBody = await this.fetchDrawHistory(historyUrl, apiKey);
      const taskBody = taskId
        ? this.findTaskInHistory(historyBody, taskId) || historyBody
        : historyBody;
      const persisted = await this.persistGeneratedImages(
        taskBody as DrawApiResponse,
        publicBaseUrl,
        new URL(historyUrl).origin,
      );

      if (persisted.generatedUrls.length) {
        return {
          responseBody: {
            ...initialResponseBody,
            history: historyBody,
            data: persisted.responseBody.data,
          },
          generatedUrls: persisted.generatedUrls,
        };
      }
    }

    return null;
  }

  private async refreshPendingRecords(userId: number) {
    const pendingRecords = await this.drawGenerationRepo.find({
      where: { userId, status: 'pending' },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    if (!pendingRecords.length) return;

    const apiKey = this.configService.get<string>('DRAW_API_KEY', '');
    if (!apiKey) return;

    const baseUrl = this.configService
      .get<string>('DRAW_BASE_URL', 'https://tupian.kklt.lol')
      .replace(/\/$/, '');
    const historyApiPath = this.configService.get<string>(
      'DRAW_HISTORY_API_PATH',
      '/api/draw/history',
    );
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL', '');
    const historyUrl = `${baseUrl}${this.normalizeApiPath(historyApiPath)}`;

    const historyBody = await this.fetchDrawHistory(historyUrl, apiKey).catch(
      () => null,
    );
    if (!historyBody) return;

    for (const record of pendingRecords) {
      const taskId = this.extractTaskId(record.responseBody || {});
      const taskBody = taskId
        ? this.findTaskInHistory(historyBody, taskId)
        : null;
      if (!taskBody) continue;

      const persisted = await this.persistGeneratedImages(
        taskBody as DrawApiResponse,
        publicBaseUrl,
        baseUrl,
      ).catch(() => null);
      if (!persisted?.generatedUrls.length) continue;

      record.status = 'success';
      record.responseBody = {
        ...(record.responseBody || {}),
        history: historyBody,
        data: persisted.responseBody.data,
      };
      record.generatedUrls = persisted.generatedUrls;
      record.errorMessage = null;
      await this.drawGenerationRepo.save(record);
    }
  }

  private async fetchDrawHistory(url: string, apiKey: string) {
    const res = await fetch(url, {
      headers: {
        'X-Draw-Key': apiKey,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
    });
    const text = await res.text();
    try {
      return text ? (JSON.parse(text) as DrawApiResponse) : {};
    } catch {
      return { raw: text };
    }
  }

  private extractTaskId(value: unknown): string {
    if (!value || typeof value !== 'object') return '';
    const record = value as Record<string, unknown>;
    for (const key of ['task_id', 'taskId']) {
      if (typeof record[key] === 'string') return record[key];
      if (typeof record[key] === 'number') return String(record[key]);
    }
    if (typeof record.id === 'string' && record.id.startsWith('task_')) {
      return record.id;
    }
    for (const nested of Object.values(record)) {
      const found = this.extractTaskId(nested);
      if (found) return found;
    }
    return '';
  }

  private isProcessingResponse(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const record = value as Record<string, unknown>;
    const status = String(record.status || record.state || '').toLowerCase();
    if (['processing', 'pending', 'running', 'queued'].includes(status)) {
      return true;
    }
    return Object.values(record).some((item) =>
      this.isProcessingResponse(item),
    );
  }

  private findTaskInHistory(value: unknown, taskId: string): unknown {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    const currentId = this.extractDirectTaskId(record);
    if (currentId === taskId) return record;

    for (const nested of Object.values(record)) {
      if (Array.isArray(nested)) {
        for (const item of nested) {
          const found = this.findTaskInHistory(item, taskId);
          if (found) return found;
        }
      } else {
        const found = this.findTaskInHistory(nested, taskId);
        if (found) return found;
      }
    }

    return null;
  }

  private extractDirectTaskId(record: Record<string, unknown>): string {
    for (const key of ['task_id', 'taskId']) {
      if (typeof record[key] === 'string') return record[key];
      if (typeof record[key] === 'number') return String(record[key]);
    }
    if (typeof record.id === 'string' && record.id.startsWith('task_')) {
      return record.id;
    }
    return '';
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private requestImageGeneration(
    url: string,
    apiKey: string,
    requestBody: Record<string, unknown>,
  ) {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Draw-Key': apiKey,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(this.toUpstreamDrawBody(requestBody)),
    });
  }

  private async requestImageEdit(
    url: string,
    apiKey: string,
    requestBody: Record<string, unknown>,
    publicBaseUrl: string,
  ) {
    const formData = new FormData();
    const body = this.toUpstreamDrawBody(requestBody);
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value));
      }
    });

    const references = Array.isArray(requestBody.image)
      ? requestBody.image
      : [];
    const firstReference = references.find(
      (image): image is string => typeof image === 'string' && !!image.trim(),
    );
    if (!firstReference) {
      throw new BadGatewayException('未找到可用参考图');
    }

    const image = await this.readReferenceImage(firstReference, publicBaseUrl);
    const imageBuffer = image.buffer.buffer.slice(
      image.buffer.byteOffset,
      image.buffer.byteOffset + image.buffer.byteLength,
    ) as ArrayBuffer;
    formData.append(
      'image',
      new Blob([imageBuffer], { type: image.mime }),
      image.filename,
    );

    return fetch(url, {
      method: 'POST',
      headers: {
        'X-Draw-Key': apiKey,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
      body: formData,
    });
  }

  private toUpstreamDrawBody(requestBody: Record<string, unknown>) {
    return {
      prompt: requestBody.prompt,
      count: requestBody.count,
      size: requestBody.size,
      resolution: requestBody.resolution,
    };
  }

  private extractUpstreamMessage(responseBody: DrawApiResponse) {
    if (typeof responseBody.message === 'string') return responseBody.message;
    if (typeof responseBody.error === 'string') return responseBody.error;

    const error = responseBody.error as Record<string, unknown> | undefined;
    if (error && typeof error.message === 'string') return error.message;

    return null;
  }

  private extractGeneratedImageItems(
    responseBody: DrawApiResponse,
    upstreamBaseUrl: string,
  ) {
    if (Array.isArray(responseBody.data)) {
      return responseBody.data
        .map((item) => this.toGeneratedImageItem(item, upstreamBaseUrl))
        .filter((item): item is GeneratedImageItem => !!item);
    }

    const candidates = [
      responseBody.data,
      responseBody.images,
      responseBody.urls,
      responseBody.results,
      responseBody.result,
      responseBody.url,
      responseBody.thumbnail_url,
      responseBody.b64_json,
    ];

    return candidates
      .flatMap((candidate) =>
        Array.isArray(candidate) ? candidate : [candidate],
      )
      .map((item) => this.toGeneratedImageItem(item, upstreamBaseUrl))
      .filter((item): item is GeneratedImageItem => !!item);
  }

  private toGeneratedImageItem(
    item: unknown,
    upstreamBaseUrl: string,
  ): GeneratedImageItem | null {
    if (!item) return null;

    if (typeof item === 'string') {
      const url = this.normalizeUpstreamImageUrl(item, upstreamBaseUrl);
      return /^data:image\//i.test(item) ? { url } : { url };
    }

    if (typeof item !== 'object') return null;

    const record = item as Record<string, unknown>;
    const url = [
      record.url,
      record.thumbnail_url,
      record.image_url,
      record.src,
      record.image,
      record.output,
      record.path,
    ].find((value): value is string => typeof value === 'string' && !!value);
    const b64Json =
      typeof record.b64_json === 'string'
        ? record.b64_json
        : typeof record.base64 === 'string'
          ? record.base64
          : undefined;

    if (!url && !b64Json) return null;
    const normalizedUrl = url
      ? this.normalizeUpstreamImageUrl(url, upstreamBaseUrl)
      : undefined;
    const normalizedThumbnailUrl =
      typeof record.thumbnail_url === 'string'
        ? this.normalizeUpstreamImageUrl(record.thumbnail_url, upstreamBaseUrl)
        : undefined;

    return {
      ...record,
      url: normalizedUrl,
      thumbnail_url: normalizedThumbnailUrl,
      b64_json: b64Json,
    };
  }

  private normalizeUpstreamImageUrl(url: string, upstreamBaseUrl: string) {
    if (/^(https?:|data:)/i.test(url)) return url;
    if (!url.startsWith('/')) return url;
    const normalizedBaseUrl = upstreamBaseUrl.replace(/\/$/, '');
    return normalizedBaseUrl ? `${normalizedBaseUrl}${url}` : url;
  }

  private async readReferenceImage(
    rawUrl: string,
    publicBaseUrl: string,
  ): Promise<ReferenceImageFile> {
    const url = rawUrl.trim();
    const dataUrlMatch = url.match(/^data:(image\/[\w.+-]+);base64,(.+)$/i);
    if (dataUrlMatch) {
      const mime = dataUrlMatch[1].toLowerCase();
      return {
        buffer: Buffer.from(dataUrlMatch[2], 'base64'),
        filename: `reference${this.extensionFromMime(mime) || '.png'}`,
        mime,
      };
    }

    if (url.startsWith('/uploads/')) {
      return this.readLocalUploadReference(url);
    }

    const normalizedBaseUrl = publicBaseUrl.replace(/\/$/, '');
    if (normalizedBaseUrl && url.startsWith(`${normalizedBaseUrl}/uploads/`)) {
      const localPath = url.slice(normalizedBaseUrl.length);
      return this.readLocalUploadReference(localPath);
    }

    if (/^https?:\/\//i.test(url)) {
      return this.fetchReferenceImage(url);
    }

    throw new BadGatewayException('参考图地址无效');
  }

  private async readLocalUploadReference(url: string) {
    const normalizedPath = normalize(url);
    if (!normalizedPath.startsWith('/uploads/')) {
      throw new BadGatewayException('参考图路径无效');
    }

    const relativePath = normalizedPath.replace(/^\/+/, '');
    const filePath = join(process.cwd(), relativePath);
    const buffer = await readFile(filePath);
    const extension = this.extensionFromUrl(`http://local${normalizedPath}`);

    return {
      buffer,
      filename: `reference${extension || '.png'}`,
      mime: this.mimeFromExtension(extension) || 'image/png',
    };
  }

  private async fetchReferenceImage(url: string) {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new BadGatewayException(`读取参考图失败 (${res.status})`);
    }

    const mime =
      res.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || '';
    const buffer = Buffer.from(await res.arrayBuffer());
    const extension =
      this.extensionFromMime(mime) || this.extensionFromUrl(url) || '.png';

    return {
      buffer,
      filename: `reference${extension}`,
      mime: mime || this.mimeFromExtension(extension) || 'image/png',
    };
  }

  private mimeFromExtension(extension: string) {
    const normalized = extension.toLowerCase();
    if (normalized === '.jpg' || normalized === '.jpeg') return 'image/jpeg';
    if (normalized === '.png') return 'image/png';
    if (normalized === '.gif') return 'image/gif';
    if (normalized === '.webp') return 'image/webp';
    return '';
  }

  private serializeRecord(record: DrawGeneration, includeBodies = false) {
    const result: Record<string, unknown> = {
      id: record.id,
      userId: record.userId,
      model: record.model,
      prompt: record.prompt,
      image: record.image || [],
      size: record.size,
      responseFormat: record.responseFormat,
      status: record.status,
      generatedUrls: record.generatedUrls || [],
      errorMessage: record.errorMessage,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    if (includeBodies) {
      result.requestBody = record.requestBody;
      result.responseBody = record.responseBody;
    }

    return result;
  }
}
