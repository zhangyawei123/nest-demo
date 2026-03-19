import { IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignMenusDto {
  @ApiProperty({ description: '菜单ID列表', example: [1, 2, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  menuIds: number[];
}
