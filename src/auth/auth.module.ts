import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { CaptchaService } from './captcha.service';
import { UserModule } from '../user/user.module';

/**
 * 认证模块
 *
 * 包含以下功能：
 *   - 用户注册 / 登录
 *   - 图片验证码生成与校验（CaptchaService）
 *   - JWT Token 签发与验证（JwtModule + JwtStrategy）
 *   - Passport 集成（PassportModule）
 *
 * 依赖 UserModule 来访问用户数据库操作
 */
@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, CaptchaService],
})
export class AuthModule {}
