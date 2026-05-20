import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';

export class UpdateFeedbackStatusDto {
  @ApiProperty({ description: '反馈 ID', example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ description: '处理状态', example: 'handled' })
  @IsIn(['pending', 'handled', 'ignored'])
  status: string;
}
