import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { RechargeOrderStatus } from '../recharge-order.entity';

export class ListRechargeOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsIn(['pending', 'paid', 'refund_pending', 'cancelled', 'refunded'])
  status?: RechargeOrderStatus;

  @IsOptional()
  @IsString()
  keyword?: string;
}
