import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateJdProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
