import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 登录 DTO - 用于登录接口的请求体参数验证
 *
 * 登录流程：
 *   1. 先请求 GET /auth/captcha 获取 captchaId 和 SVG 图片
 *   2. 用户填写用户名、密码、验证码，一起提交到本接口
 */
export class LoginUserDto {
  /** 用户名 */
  @ApiProperty({ description: '用户名', example: 'testuser' })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  /** 登录密码 */
  @ApiProperty({ description: '登录密码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;

  /** 验证码 ID（由 GET /auth/captcha 接口返回） */
  @ApiProperty({ description: '验证码 ID，先请求 GET /auth/captcha 获得', example: '1710000000000-abc123' })
  @IsString()
  @IsNotEmpty({ message: '验证码 ID 不能为空' })
  captchaId: string;

  /** 用户输入的验证码文本（不区分大小写） */
  @ApiProperty({ description: '图片验证码内容（不区分大小写）', example: 'ab3k' })
  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  captchaCode: string;
}
