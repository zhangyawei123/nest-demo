import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'child_process';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { tmpdir } from 'os';

@Injectable()
export class VisionService {
  constructor(private readonly configService: ConfigService) {}

  async detectFaces(file: any) {
    this.validateImageFile(file);
    const imagePath = await this.writeTempImage(file);

    try {
      const stdout = await this.runPython(imagePath);
      const result = JSON.parse(stdout);
      const faceCount = Number(result?.faceCount || 0);
      const faces = Array.isArray(result?.faces) ? result.faces : [];

      return {
        faceCount,
        faces,
        hasFace: faceCount > 0,
        summary:
          faceCount > 0
            ? `检测到 ${faceCount} 张人脸`
            : '未检测到清晰人脸，请更换正面照片后重试',
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || '人脸识别失败',
      );
    } finally {
      await fs.unlink(imagePath).catch(() => undefined);
    }
  }

  async analyzeRecipeCombo(file: any) {
    this.validateImageFile(file);

    const baseUrl = this.configService.get<string>('AI_BASE_URL', '');
    const apiKey = this.configService.get<string>('AI_API_KEY', '');
    const visionModel = this.configService.get<string>('AI_VISION_MODEL', '');
    const fallbackModel = this.configService.get<string>('AI_MODEL', '');
    const model = visionModel || fallbackModel;

    if (!baseUrl || !apiKey || !model) {
      throw new ServiceUnavailableException(
        '未配置图片分析模型，请在 .env 中设置 AI_VISION_MODEL',
      );
    }

    if (!visionModel) {
      throw new ServiceUnavailableException(
        '当前未配置视觉模型 AI_VISION_MODEL，无法分析图片内容',
      );
    }

    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const prompt = [
      '请分析这张菜谱或菜品图片。',
      '如果是菜单、餐盘、食材图，请识别其中的菜品或主要食材。',
      '请输出严格 JSON，不要带 markdown 代码块。',
      'JSON 结构如下：',
      '{',
      '  "summary": "一句话总结图片内容",',
      '  "dishes": ["菜品1", "菜品2"],',
      '  "ingredients": ["食材1", "食材2"],',
      '  "recommendedCombo": {',
      '    "name": "套餐名称",',
      '    "items": ["主食", "荤菜", "素菜", "饮品"],',
      '    "reason": "为什么这样搭配"',
      '  },',
      '  "nutritionTips": ["营养建议1", "营养建议2"]',
      '}',
      '如果无法完全判断，也请基于图片给出尽量合理的推测，不要返回 null。',
    ].join('\n');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: '你是一名擅长识别菜品、分析营养并设计套餐的智能营养师。',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ServiceUnavailableException(
        this.extractAiErrorMessage(response.status, text),
      );
    }

    const json: any = await response.json();
    const content = json?.choices?.[0]?.message?.content || '';
    const parsed = this.parseRecipeResponse(content);

    return {
      summary: String(parsed.summary || '已完成图片分析'),
      dishes: this.normalizeStringArray(parsed.dishes),
      ingredients: this.normalizeStringArray(parsed.ingredients),
      recommendedCombo: {
        name: String(parsed?.recommendedCombo?.name || '智能推荐套餐'),
        items: this.normalizeStringArray(parsed?.recommendedCombo?.items),
        reason: String(
          parsed?.recommendedCombo?.reason || '根据图片中的内容做了均衡搭配建议',
        ),
      },
      nutritionTips: this.normalizeStringArray(parsed.nutritionTips),
      rawReply: content,
    };
  }

  private extractAiErrorMessage(status: number, text: string) {
    const raw = String(text || '').trim();

    try {
      const parsed = JSON.parse(raw);
      const message =
        parsed?.error?.message ||
        parsed?.message ||
        parsed?.detail ||
        raw;
      return `图片分析请求失败 (${status}): ${message}`;
    } catch {
      return `图片分析请求失败 (${status}): ${raw || '上游模型返回异常'}`;
    }
  }

  private validateImageFile(file: any) {
    if (!file) {
      throw new BadRequestException('请选择图片');
    }

    if (!file.mimetype?.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      throw new BadRequestException('只支持 jpg、jpeg、png、gif、webp 图片');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('图片大小不能超过 5MB');
    }
  }

  private async writeTempImage(file: any) {
    const dir = join(tmpdir(), 'nest-demo-vision');
    await fs.mkdir(dir, { recursive: true });
    const suffix = extname(file.originalname || '') || '.png';
    const imagePath = join(dir, `${randomUUID()}${suffix}`);
    await fs.writeFile(imagePath, file.buffer);
    return imagePath;
  }

  private runPython(imagePath: string) {
    const scriptPath = join(process.cwd(), 'scripts', 'face_detect.py');

    return new Promise<string>((resolve, reject) => {
      execFile(
        'python3',
        [scriptPath, imagePath],
        { maxBuffer: 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr?.trim() || error.message));
            return;
          }
          resolve(stdout.trim());
        },
      );
    });
  }

  private parseRecipeResponse(content: string) {
    const text = String(content || '').trim();
    if (!text) {
      return {
        summary: '未能识别到有效内容',
        dishes: [],
        ingredients: [],
        recommendedCombo: {
          name: '智能推荐套餐',
          items: [],
          reason: '请重新上传更清晰的图片',
        },
        nutritionTips: [],
      };
    }

    const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonText = (fencedMatch ? fencedMatch[1] : text).trim();

    try {
      return JSON.parse(jsonText);
    } catch {
      return {
        summary: text,
        dishes: [],
        ingredients: [],
        recommendedCombo: {
          name: '智能推荐套餐',
          items: [],
          reason: '模型返回了文本结果，已保留原始分析内容',
        },
        nutritionTips: [],
      };
    }
  }

  private normalizeStringArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }
}
