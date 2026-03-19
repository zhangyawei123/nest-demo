import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建用户 DTO - 用于注册接口的请求体参数验证
 * 注册只需要用户名 + 密码，不需要邮箱
 */
export class CreateUserDto {
  /** 用户名：3-50 位字符，不能为空 */
  @ApiProperty({ description: '用户名', example: 'testuser', minLength: 3, maxLength: 50 })
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名至少3位' })
  @MaxLength(50, { message: '用户名最多50位' })
  username: string;

  /** 密码：至少 6 位 */
  @ApiProperty({ description: '密码（至少6位）', example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  password: string;
}
