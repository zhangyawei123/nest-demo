import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PointsService } from './points.service';

@ApiTags('积分')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @ApiOperation({ summary: '获取积分概览' })
  @Get('profile')
  profile(@Request() req) {
    return this.pointsService.getProfile(req.user.userId);
  }

  @ApiOperation({ summary: '每日签到' })
  @Post('sign-in')
  signIn(@Request() req) {
    return this.pointsService.signIn(req.user.userId);
  }

  @ApiOperation({ summary: '获取签到日历' })
  @Get('calendar')
  calendar(@Request() req, @Query('month') month?: string) {
    return this.pointsService.getCalendar(req.user.userId, month);
  }

  @ApiOperation({ summary: '补签指定日期' })
  @Post('makeup-sign-in')
  makeupSignIn(@Request() req, @Body('date') date: string) {
    return this.pointsService.makeupSignIn(req.user.userId, date);
  }

  @ApiOperation({ summary: '获取积分流水' })
  @Get('logs')
  logs(
    @Request() req,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.pointsService.findLogs(
      req.user.userId,
      Number(page) || 1,
      Number(pageSize) || 20,
    );
  }
}
