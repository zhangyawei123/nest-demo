import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 更新用户 DTO - 用于修改用户信息的请求体参数验证
 * 所有字段均为可选，只传需要修改的字段即可
 */
export class UpdateUserDto {
  /** 新用户名（可选）：3-50 位字符 */
  @ApiPropertyOptional({ description: '新用户名', example: 'newname', minLength: 3, maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: '用户名至少3位' })
  @MaxLength(50, { message: '用户名最多50位' })
  username?: string;

  /** 新密码（可选）：至少 6 位 */
  @ApiPropertyOptional({ description: '新密码（至少6位）', example: 'newpass123', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  password?: string;
}
