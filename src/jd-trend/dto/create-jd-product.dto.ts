import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateJdProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  name?: string;
}
