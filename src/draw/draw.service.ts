import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { Repository } from 'typeorm';
import {
  CreateDrawGenerationDto,
  QueryDrawGenerationHistoryDto,
} from './draw.dto';
import { DrawGeneration } from './draw-generation.entity';

interface DrawApiResponse {
  created?: number;
  data?: Array<{ url?: string; b64_json?: string; [key: string]: unknown }>;
  usage?: Record<string, unknown>;
  [key: string]: unknown;
}

@Injectable()
export class DrawService {
  private readonly maxPersistImageSize = 20 * 1024 * 1024;
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
  ) {}

  async generate(userId: number, dto: CreateDrawGenerationDto) {
    if (!userId) {
      throw new ServiceUnavailableException('用户身份无效');
    }

    const baseUrl = this.configService.get<string>(
      'DRAW_BASE_URL',
      'https://www.right.codes',
    );
    const apiKey = this.configService.get<string>('DRAW_API_KEY', '');
    const model =
      dto.model || this.configService.get<string>('DRAW_MODEL', 'gpt-image-2');
    const apiPath = '/draw/v1/images/generations';
    const publicBaseUrl = this.configService.get<string>('PUBLIC_BASE_URL', '');

    if (!apiKey) {
      throw new ServiceUnavailableException('未配置生图服务密钥');
    }

    const rawImages = dto.image || [];
    const requestBody = {
      model,
      prompt: dto.prompt,
      image: this.normalizeImageUrls(rawImages, publicBaseUrl),
      size: dto.size || '',
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
      const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
      const normalizedApiPath = apiPath.startsWith('/')
        ? apiPath
        : `/${apiPath}`;
      const res = await fetch(`${normalizedBaseUrl}${normalizedApiPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
        body: JSON.stringify(requestBody),
      });

      const text = await res.text();
      let responseBody: DrawApiResponse;

      try {
        responseBody = text ? JSON.parse(text) : {};
      } catch {
        responseBody = { raw: text };
      }

      if (!res.ok) {
        const upstreamMessage =
          typeof responseBody.message === 'string'
            ? responseBody.message
            : typeof responseBody.error === 'string'
              ? responseBody.error
              : null;
        const errorMessage = upstreamMessage
          ? `生图服务请求失败 (${res.status}): ${upstreamMessage}`
          : `生图服务请求失败 (${res.status})`;
        record.status = 'failed';
        record.responseBody = responseBody as Record<string, unknown>;
        record.errorMessage = errorMessage;
        await this.drawGenerationRepo.save(record);
        throw new BadGatewayException(errorMessage);
      }

      const persisted = await this.persistGeneratedImages(
        responseBody,
        publicBaseUrl,
      );

      record.status = 'success';
      record.responseBody = persisted.responseBody as Record<string, unknown>;
      record.generatedUrls = persisted.generatedUrls;
      record.errorMessage = null;
      await this.drawGenerationRepo.save(record);

      return {
        id: record.id,
        ...persisted.responseBody,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : '生图服务请求异常';
      record.status = 'failed';
      record.errorMessage = message;
      await this.drawGenerationRepo.save(record);
      throw new BadGatewayException('生图服务请求异常');
    }
  }

  async findHistory(userId: number, query: QueryDrawGenerationHistoryDto) {
    if (!userId) {
      throw new ServiceUnavailableException('用户身份无效');
    }

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
  ) {
    if (!Array.isArray(responseBody.data) || responseBody.data.length === 0) {
      return {
        responseBody,
        generatedUrls: [] as string[],
      };
    }

    const data = await Promise.all(
      responseBody.data.map(async (item, index) => {
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
    item: { url?: string; b64_json?: string },
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

  private async readGeneratedImage(item: { url?: string; b64_json?: string }) {
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
