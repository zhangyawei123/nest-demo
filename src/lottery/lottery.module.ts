import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LotteryPrize } from './lottery-prize.entity';
import { LotteryRecord } from './lottery-record.entity';
import { LotteryService } from './lottery.service';
import { LotteryController } from './lottery.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LotteryPrize, LotteryRecord])],
  controllers: [LotteryController],
  providers: [LotteryService],
})
export class LotteryModule {}
