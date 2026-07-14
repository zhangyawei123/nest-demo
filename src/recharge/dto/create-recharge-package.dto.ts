import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRechargePackageDto {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsInt()
  @Min(1)
  priceCents: number;

  @IsInt()
  @Min(1)
  points: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bonusPoints?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;
}
