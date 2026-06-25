import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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
