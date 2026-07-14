import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmRechargeOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;
}
