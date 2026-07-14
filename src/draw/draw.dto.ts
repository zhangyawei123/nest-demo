import {
  IsArray,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDrawGenerationDto {
  @IsOptional()
  @IsString()
  model?: string;

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsArray()
  image?: unknown[];

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  count?: number;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsString()
  response_format?: string;
}

export class QueryDrawGenerationHistoryDto {
  @IsOptional()
  page?: string;

  @IsOptional()
  pageSize?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(['pending', 'success', 'failed'])
  status?: string;
}
