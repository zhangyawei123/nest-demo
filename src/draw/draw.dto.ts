import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
