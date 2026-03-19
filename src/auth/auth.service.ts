import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CaptchaService } from './captcha.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginUserDto } from '../user/dto/login-user.dto';

/**
 * 认证服务 - 处理登录、注册等认证逻辑
 *
 * 依赖：
 *   - UserService：负责用户的数据库操作
 *   - JwtService：生成和验证 JWT Token
 *   - CaptchaService：生成和校验图片验证码
 */
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private captchaService: CaptchaService,
  ) {}

  /**
   * 用户注册
   * @param createUserDto 注册信息（用户名 + 密码）
   * @returns 用户信息（不包含密码字段）
   */
  async register(createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);
    // 解构展开，过滤掉 password 字段再返回
    const { password, ...result } = user;
    return result;
  }

  /**
   * 用户登录（需要验证图片验证码）
   *
   * 流程：验证码 → 用户名存在性 → 密码正确性 → 签发 JWT
   * @param loginUserDto 登录信息（用户名 + 密码 + captchaId + captchaCode）
   * @returns access_token 和用户基本信息
   * @throws UnauthorizedException 验证码错误 / 用户名或密码错误
   */
  async login(loginUserDto: LoginUserDto) {
    // 第一步：校验图片验证码
    const isCaptchaValid = this.captchaService.verify(
      loginUserDto.captchaId,
      loginUserDto.captchaCode,
    );
    if (!isCaptchaValid) {
      throw new UnauthorizedException('验证码错误或已过期，请重新获取');
    }

    // 第二步：查找用户
    const user = await this.userService.findByUsername(loginUserDto.username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 第三步：校验密码
    const isPasswordValid = await this.userService.validatePassword(
      loginUserDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 第四步：生成 JWT Token（payload 中存放用户 id 和 username）
    const payload = { sub: user.id, username: user.username };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
      },
    };
  }

  /**
   * 验证用户（由 JwtStrategy.validate 调用，每次访问受保护接口时自动触发）
   * @param userId JWT payload.sub
   * @returns 用户实体
   */
  async validateUser(userId: number) {
    return this.userService.findById(userId);
  }
}
