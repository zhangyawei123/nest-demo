import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryFeedbackDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', example: 10 })
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({ description: '处理状态', example: 'pending' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: '关键词', example: '建议' })
  @IsString()
  @IsOptional()
  keyword?: string;
}
