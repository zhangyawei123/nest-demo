import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 创建文章 DTO
 */
export class CreateArticleDto {
  @ApiProperty({ description: '文章标题', example: '我的第一篇文章' })
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(200, { message: '标题最多200个字符' })
  title: string;

  @ApiProperty({ description: '文章封面图 URL', example: 'https://example.com/logo.jpg', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Logo URL 最多500个字符' })
  logo?: string;

  @ApiProperty({ description: '文章内容（富文本 HTML）', example: '<p>这是文章内容</p>' })
  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;
}
