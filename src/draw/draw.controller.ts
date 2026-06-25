import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateDrawGenerationDto,
  QueryDrawGenerationHistoryDto,
} from './draw.dto';
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

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '获取生图历史' })
  @Get('generations/history')
  history(@Query() query: QueryDrawGenerationHistoryDto, @Request() req) {
    return this.drawService.findHistory(req.user.userId, query);
  }

  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '获取生图记录详情' })
  @Get('generations/:id')
  detail(@Param('id') id: string, @Request() req) {
    return this.drawService.findOne(req.user.userId, Number(id));
  }
}
