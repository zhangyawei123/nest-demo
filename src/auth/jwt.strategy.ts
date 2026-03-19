import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

/**
 * JWT 策略 - 每次访问受 JwtAuthGuard 保护的接口时自动触发
 *
 * 工作流程：
 *   1. 从 HTTP 请求头 Authorization: Bearer <token> 中提取 JWT
 *   2. 使用 JWT_SECRET 验证签名和有效期
 *   3. 将解码后的 payload 传入 validate() 方法
 *   4. validate() 返回的对象会被挂载到 req.user 上，供 Controller 使用
 *
 * JWT payload 结构（登录时签发）：
 *   { sub: userId, username: string }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      // 从请求头 Authorization: Bearer <token> 中提取 Token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // false 表示不忽略过期时间，Token 过期后请求会被拒绝
      ignoreExpiration: false,
      // 与签发 Token 时使用的密钥保持一致
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
    });
  }

  /**
   * 验证 JWT payload 并返回用户信息
   *
   * 此方法在 Token 验证通过后自动调用，返回值会被挂载到 req.user
   * @param payload JWT 解码后的载荷，包含 sub（用户ID）和 username
   * @returns 挂载到 req.user 的对象：{ userId, username }
   */
  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);
    // 返回的对象会成为 req.user，不包含敏感字段（如密码）
    return { userId: user.id, username: user.username };
  }
}
