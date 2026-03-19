import { Injectable } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';

/**
 * 验证码服务 - 负责生成图片验证码并在内存中短暂缓存
 *
 * 工作流程：
 *   1. 客户端请求 GET /auth/captcha 获取 SVG 图片和 captchaId
 *   2. 服务端将 { captchaId -> text } 存入内存 Map，并设置 5 分钟过期
 *   3. 客户端登录时携带 captchaId + captchaCode，服务端校验后删除该条记录
 *
 * 注意：当前使用内存存储，重启服务后验证码失效；生产环境建议替换为 Redis
 */
@Injectable()
export class CaptchaService {
  /**
   * 内存验证码存储
   * key:   captchaId（随机字符串，发给客户端）
   * value: { text: 验证码文本, expireAt: 过期时间戳 }
   */
  private readonly store = new Map<string, { text: string; expireAt: number }>();

  /** 验证码有效期：5 分钟（毫秒） */
  private readonly TTL = 5 * 60 * 1000;

  /**
   * 生成一张 SVG 图片验证码
   * @returns { captchaId, svg }
   *   - captchaId: 客户端下次登录时需要携带的 ID
   *   - svg:       SVG 格式的验证码图片字符串，前端直接渲染
   */
  generate(): { captchaId: string; svg: string } {
    // 生成含 4 位字母数字的 SVG 验证码
    const captcha = svgCaptcha.create({
      size: 4,          // 验证码字符数
      noise: 0,         // 干扰线条数
      color: true,      // 彩色字符
      background: '#f0f0f0',
      width: 120,
      height: 40,
      fontSize: 40,
      ignoreChars: '0oO1lIi', // 排除容易混淆的字符
    });

    // 生成唯一 captchaId（时间戳 + 随机数）
    const captchaId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    // 写入内存缓存，设置过期时间
    this.store.set(captchaId, {
      text: captcha.text.toLowerCase(), // 统一转小写，忽略大小写
      expireAt: Date.now() + this.TTL,
    });

    // 定时清理过期记录，防止内存泄漏
    setTimeout(() => this.store.delete(captchaId), this.TTL + 1000);

    return { captchaId, svg: captcha.data };
  }

  /**
   * 校验验证码是否正确
   * @param captchaId  客户端持有的验证码 ID
   * @param inputCode  用户输入的验证码文本
   * @returns true 表示验证通过；false 表示验证码错误、已过期或不存在
   */
  verify(captchaId: string, inputCode: string): boolean {
    const record = this.store.get(captchaId);

    // 不存在或已过期
    if (!record || Date.now() > record.expireAt) {
      this.store.delete(captchaId);
      return false;
    }

    // 验证后立即删除，防止重复使用
    this.store.delete(captchaId);

    return record.text === inputCode.toLowerCase();
  }
}
