import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class ArticleIdDto {
  @ApiProperty({ description: '文章 ID', example: 1 })
  @IsInt()
  articleId: number;
}
