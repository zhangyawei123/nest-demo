import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: '管理员' })
  @IsString()
  @IsNotEmpty({ message: '角色名称不能为空' })
  name: string;

  @ApiPropertyOptional({ description: '角色描述', example: '拥有所有权限' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '菜单ID列表', example: [1, 2, 3] })
  @IsArray()
  @IsOptional()
  menuIds?: number[];
}
