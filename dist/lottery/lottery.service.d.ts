import { Repository } from 'typeorm';
import { LotteryPrize } from './lottery-prize.entity';
import { LotteryRecord } from './lottery-record.entity';
import { CreatePrizeDto } from './dto/create-prize.dto';
export declare class LotteryService {
    private readonly prizeRepository;
    private readonly recordRepository;
    constructor(prizeRepository: Repository<LotteryPrize>, recordRepository: Repository<LotteryRecord>);
    findAllPrizes(): Promise<LotteryPrize[]>;
    findOnePrize(id: number): Promise<LotteryPrize>;
    createPrize(dto: CreatePrizeDto): Promise<LotteryPrize>;
    updatePrize(id: number, dto: Partial<CreatePrizeDto>): Promise<LotteryPrize>;
    removePrize(id: number): Promise<void>;
    draw(userId?: number): Promise<{
        prize: LotteryPrize;
        index: number;
    }>;
    getRecords(page?: number, pageSize?: number): Promise<{
        list: LotteryRecord[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
