import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class JdNotificationService {
  private readonly logger = new Logger(JdNotificationService.name);

  constructor(private readonly configService: ConfigService) {}

  getStatus() {
    return {
      dingtalkConfigured: Boolean(
        this.configService.get<string>('DINGTALK_WEBHOOK_URL'),
      ),
      wecomConfigured: Boolean(
        this.configService.get<string>('WECOM_WEBHOOK_URL'),
      ),
      reportNotificationEnabled:
        this.configService.get<string>('JD_TREND_NOTIFY_REPORT') === 'true',
    };
  }

  async sendCookieAlert(cookieStatus: string): Promise<void> {
    const statusText =
      cookieStatus === 'expired'
        ? 'Cookie 已失效，请重新登录京东并更新服务器配置。'
        : '京东触发了安全验证，采集暂时无法继续。';
    await this.send(
      '京东趋势监控告警',
      `### 京东趋势监控告警\n\n${statusText}\n\n时间：${this.formatNow()}`,
    );
  }

  async sendReport(report: {
    reportDate: string;
    productCount: number;
    successCount: number;
    status: string;
  }): Promise<void> {
    if (this.configService.get<string>('JD_TREND_NOTIFY_REPORT') !== 'true') {
      return;
    }
    await this.send(
      `京东商品趋势日报 ${report.reportDate}`,
      [
        `### 京东商品趋势日报 ${report.reportDate}`,
        '',
        `监控商品：${report.productCount} 件`,
        '',
        `采集成功：${report.successCount} 件`,
        '',
        `报告状态：${report.status}`,
      ].join('\n'),
    );
  }

  private async send(title: string, markdown: string): Promise<void> {
    const tasks: Promise<void>[] = [];
    const dingtalkWebhook = this.configService.get<string>(
      'DINGTALK_WEBHOOK_URL',
    );
    const wecomWebhook = this.configService.get<string>('WECOM_WEBHOOK_URL');

    if (dingtalkWebhook) {
      tasks.push(this.sendDingtalk(dingtalkWebhook, title, markdown));
    }
    if (wecomWebhook) {
      tasks.push(this.sendWecom(wecomWebhook, markdown));
    }
    await Promise.allSettled(tasks);
  }

  private async sendDingtalk(
    webhook: string,
    title: string,
    markdown: string,
  ): Promise<void> {
    const url = new URL(webhook);
    const secret = this.configService.get<string>('DINGTALK_SECRET');
    if (secret) {
      const timestamp = Date.now().toString();
      const sign = createHmac('sha256', secret)
        .update(`${timestamp}\n${secret}`)
        .digest('base64');
      url.searchParams.set('timestamp', timestamp);
      url.searchParams.set('sign', sign);
    }
    await this.postJson(url.toString(), {
      msgtype: 'markdown',
      markdown: { title, text: markdown },
    });
  }

  private async sendWecom(webhook: string, markdown: string): Promise<void> {
    await this.postJson(webhook, {
      msgtype: 'markdown',
      markdown: { content: markdown },
    });
  }

  private async postJson(url: string, body: unknown): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      this.logger.error(
        `通知发送失败：${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private formatNow(): string {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date());
  }
}
