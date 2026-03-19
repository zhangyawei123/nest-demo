import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrizeDto {
  @ApiProperty({ description: '奖项名称', example: '一等奖' })
  @IsString()
  @IsNotEmpty({ message: '奖项名称不能为空' })
  name: string;

  @ApiPropertyOptional({ description: '奖项描述', example: 'iPhone 15 Pro' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '图标（emoji或图片url）', example: '🎁' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: '中奖概率（0-100）', example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100)
  probability: number;

  @ApiPropertyOptional({ description: '扇形颜色', example: '#FF6B6B' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: '排序', example: 0 })
  @IsNumber()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: '是否启用', example: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
