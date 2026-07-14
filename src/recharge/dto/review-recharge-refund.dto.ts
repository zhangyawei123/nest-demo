import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewRechargeRefundDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  remark?: string;
}
