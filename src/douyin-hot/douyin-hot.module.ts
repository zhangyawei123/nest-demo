import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DouyinHot } from './douyin-hot.entity';
import { DouyinHotService } from './douyin-hot.service';
import { DouyinHotController } from './douyin-hot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DouyinHot])],
  controllers: [DouyinHotController],
  providers: [DouyinHotService],
})
export class DouyinHotModule {}
