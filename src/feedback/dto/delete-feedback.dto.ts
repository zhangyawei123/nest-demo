import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class DeleteFeedbackDto {
  @ApiProperty({ description: '反馈 ID', example: 1 })
  @IsInt()
  id: number;
}
