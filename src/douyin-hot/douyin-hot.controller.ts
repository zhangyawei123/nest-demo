import { Controller, Get, Post } from '@nestjs/common';
import { DouyinHotService } from './douyin-hot.service';
import { DouyinHot } from './douyin-hot.entity';

@Controller('douyin-hot')
export class DouyinHotController {
  constructor(private readonly douyinHotService: DouyinHotService) {}

  @Get()
  async findAll(): Promise<DouyinHot[]> {
    return this.douyinHotService.findAll();
  }

  @Post('refresh')
  async refresh(): Promise<DouyinHot[]> {
    return this.douyinHotService.fetchAndSaveHotList();
  }
}
