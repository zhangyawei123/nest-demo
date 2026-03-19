import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LotteryPrize } from './lottery-prize.entity';
import { LotteryRecord } from './lottery-record.entity';
import { CreatePrizeDto } from './dto/create-prize.dto';

@Injectable()
export class LotteryService {
  constructor(
    @InjectRepository(LotteryPrize)
    private readonly prizeRepository: Repository<LotteryPrize>,
    @InjectRepository(LotteryRecord)
    private readonly recordRepository: Repository<LotteryRecord>,
  ) {}

  async findAllPrizes(): Promise<LotteryPrize[]> {
    return this.prizeRepository.find({ order: { sort: 'ASC', id: 'ASC' } });
  }

  async findOnePrize(id: number): Promise<LotteryPrize> {
    const prize = await this.prizeRepository.findOne({ where: { id } });
    if (!prize) throw new NotFoundException('奖项不存在');
    return prize;
  }

  async createPrize(dto: CreatePrizeDto): Promise<LotteryPrize> {
    const prize = this.prizeRepository.create(dto);
    return this.prizeRepository.save(prize);
  }

  async updatePrize(id: number, dto: Partial<CreatePrizeDto>): Promise<LotteryPrize> {
    await this.findOnePrize(id);
    await this.prizeRepository.update(id, dto);
    return this.findOnePrize(id);
  }

  async removePrize(id: number): Promise<void> {
    await this.findOnePrize(id);
    await this.prizeRepository.delete(id);
  }

  async draw(userId?: number): Promise<{ prize: LotteryPrize; index: number }> {
    const prizes = await this.prizeRepository.find({
      where: { enabled: true },
      order: { sort: 'ASC', id: 'ASC' },
    });
    if (!prizes.length) throw new NotFoundException('暂无可用奖项');

    const totalProb = prizes.reduce((sum, p) => sum + Number(p.probability), 0);
    const rand = Math.random() * totalProb;
    let cumulative = 0;
    let winner = prizes[prizes.length - 1];
    let winnerIndex = prizes.length - 1;

    for (let i = 0; i < prizes.length; i++) {
      cumulative += Number(prizes[i].probability);
      if (rand <= cumulative) {
        winner = prizes[i];
        winnerIndex = i;
        break;
      }
    }

    const record = this.recordRepository.create({
      prizeId: winner.id,
      prizeName: winner.name,
      userId: userId || undefined,
    });
    await this.recordRepository.save(record);

    return { prize: winner, index: winnerIndex };
  }

  async getRecords(page = 1, pageSize = 10) {
    const [list, total] = await this.recordRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }
}
