import { IsString, MaxLength, MinLength } from 'class-validator';

export class RequestRechargeRefundDto {
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  reason: string;
}
