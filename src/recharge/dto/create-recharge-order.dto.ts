import { IsInt, Min } from 'class-validator';

export class CreateRechargeOrderDto {
  @IsInt()
  @Min(1)
  packageId: number;
}
