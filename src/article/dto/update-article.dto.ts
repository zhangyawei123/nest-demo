import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 更新文章 DTO
 */
export class UpdateArticleDto {
  @ApiProperty({ description: '文章标题', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200, { message: '标题最多200个字符' })
  title?: string;

  @ApiProperty({ description: '文章封面图 URL', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Logo URL 最多500个字符' })
  logo?: string;

  @ApiProperty({ description: '文章内容（富文本 HTML）', required: false })
  @IsString()
  @IsOptional()
  content?: string;
}
