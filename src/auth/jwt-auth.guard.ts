import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT 认证守卫 - 保护需要登录才能访问的接口
 *
 * 使用方式：在 Controller 的类或方法上添加 @UseGuards(JwtAuthGuard)
 *
 * 工作流程：
 *   1. 拦截请求，调用 JwtStrategy 验证 Authorization Header 中的 Bearer Token
 *   2. Token 有效 → 将用户信息挂载到 req.user，放行请求
 *   3. Token 无效/过期/缺失 → 返回 401 Unauthorized
 *
 * 示例：
 *   @UseGuards(JwtAuthGuard)
 *   @Get('profile')
 *   getProfile(@Request() req) { return req.user; }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
