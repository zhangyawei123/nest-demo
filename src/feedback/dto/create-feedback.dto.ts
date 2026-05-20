import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({ description: '反馈类型', example: '功能建议' })
  @IsString()
  @IsNotEmpty({ message: '反馈类型不能为空' })
  @MaxLength(50)
  type: string;

  @ApiProperty({ description: '反馈内容', example: '希望增加文章收藏功能' })
  @IsString()
  @IsNotEmpty({ message: '反馈内容不能为空' })
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({ description: '联系方式', example: 'wechat@example' })
  @IsString()
  @IsOptional()
  @MaxLength(120)
  contact?: string;
}
