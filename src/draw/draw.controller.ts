import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDrawGenerationDto } from './draw.dto';
import { DrawService } from './draw.service';

@ApiTags('生图')
@Controller('draw/v1/images')
@UseGuards(JwtAuthGuard)
export class DrawController {
  constructor(private readonly drawService: DrawService) {}

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '生成图片' })
  @Post('generations')
  generate(@Body() dto: CreateDrawGenerationDto, @Request() req) {
    return this.drawService.generate(req.user.userId, dto);
  }
}
