import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LotteryService } from './lottery.service';
import { CreatePrizeDto } from './dto/create-prize.dto';
import { UpdatePrizeDto } from './dto/update-prize.dto';

@ApiTags('抽奖管理')
@Controller('lottery')
export class LotteryController {
  constructor(private readonly lotteryService: LotteryService) {}

  @ApiOperation({ summary: '获取所有奖项' })
  @Get('prizes')
  findAllPrizes() {
    return this.lotteryService.findAllPrizes();
  }

  @ApiOperation({ summary: '创建奖项' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('prizes/create')
  createPrize(@Body() dto: CreatePrizeDto) {
    return this.lotteryService.createPrize(dto);
  }

  @ApiOperation({ summary: '更新奖项' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('prizes/update/:id')
  updatePrize(@Param('id') id: string, @Body() dto: UpdatePrizeDto) {
    return this.lotteryService.updatePrize(+id, dto);
  }

  @ApiOperation({ summary: '删除奖项' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('prizes/delete/:id')
  removePrize(@Param('id') id: string) {
    return this.lotteryService.removePrize(+id);
  }

  @ApiOperation({ summary: '执行抽奖' })
  @Post('draw')
  async draw(@Request() req) {
    const userId = req.user?.userId;
    return this.lotteryService.draw(userId);
  }

  @ApiOperation({ summary: '获取抽奖记录' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('records')
  getRecords(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ) {
    return this.lotteryService.getRecords(+page || 1, +pageSize || 10);
  }
}
