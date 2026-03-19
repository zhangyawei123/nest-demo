import { Controller, Post, Body, Get, UseGuards, Request, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginUserDto } from '../user/dto/login-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * 认证控制器 - 处理注册、登录、验证码等 HTTP 请求
 *
 * 接口列表：
 *   GET  /auth/captcha   - 获取图片验证码
 *   POST /auth/register  - 用户注册
 *   POST /auth/login     - 用户登录（含验证码）
 *   GET  /auth/profile   - 获取当前登录用户信息（需 JWT）
 */
@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private captchaService: CaptchaService,
  ) {}

  /**
   * 获取图片验证码
   */
  @ApiOperation({ summary: '获取图片验证码' })
  @Get('captcha')
  getCaptcha() {
    return this.captchaService.generate();
  }

  /**
   * 用户注册（密码已 MD5）
   */
  @ApiOperation({ summary: '用户注册' })
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  /**
   * 用户登录（密码已 MD5，含验证码）
   */
  @ApiOperation({ summary: '用户登录' })
  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  /**
   * 获取当前登录用户信息
   */
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
