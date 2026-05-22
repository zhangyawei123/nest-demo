import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDrawGenerationDto } from './draw.dto';
import { DrawGeneration } from './draw-generation.entity';

interface DrawApiResponse {
  created?: number;
  data?: Array<{ url?: string }>;
  usage?: Record<string, unknown>;
  [key: string]: unknown;
}

@Injectable()
export class DrawService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(DrawGeneration)
    private readonly drawGenerationRepo: Repository<DrawGeneration>,
  ) {}

  async generate(userId: number, dto: CreateDrawGenerationDto) {
    const baseUrl = this.configService.get<string>(
      'DRAW_BASE_URL',
      'https://www.right.codes',
    );
    const apiKey = this.configService.get<string>('DRAW_API_KEY', '');
    const model = dto.model || this.configService.get<string>('DRAW_MODEL', 'gpt-image-2');

    if (!apiKey) {
      throw new ServiceUnavailableException('未配置生图服务密钥');
    }

    const requestBody = {
      model,
      prompt: dto.prompt,
      image: dto.image || [],
      size: dto.size || '',
      response_format: dto.response_format || 'url',
    };

    const record = await this.drawGenerationRepo.save(
      this.drawGenerationRepo.create({
        userId,
        model: requestBody.model,
        prompt: requestBody.prompt,
        image: requestBody.image,
        size: requestBody.size,
        responseFormat: requestBody.response_format,
        status: 'pending',
        requestBody,
        responseBody: null,
        generatedUrls: null,
        errorMessage: null,
      }),
    );

    try {
      const res = await fetch(`${baseUrl}/draw/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
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
        const errorMessage = `生图服务请求失败 (${res.status})`;
        record.status = 'failed';
        record.responseBody = responseBody as Record<string, unknown>;
        record.errorMessage = errorMessage;
        await this.drawGenerationRepo.save(record);
        throw new BadGatewayException(errorMessage);
      }

      const generatedUrls = Array.isArray(responseBody.data)
        ? responseBody.data
            .map((item) => item?.url)
            .filter((url): url is string => Boolean(url))
        : [];

      record.status = 'success';
      record.responseBody = responseBody as Record<string, unknown>;
      record.generatedUrls = generatedUrls;
      record.errorMessage = null;
      await this.drawGenerationRepo.save(record);

      return {
        id: record.id,
        ...responseBody,
      };
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : '生图服务请求异常';
      record.status = 'failed';
      record.errorMessage = message;
      await this.drawGenerationRepo.save(record);
      throw new BadGatewayException('生图服务请求异常');
    }
  }
}
