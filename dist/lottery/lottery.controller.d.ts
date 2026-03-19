import { LotteryService } from './lottery.service';
import { CreatePrizeDto } from './dto/create-prize.dto';
import { UpdatePrizeDto } from './dto/update-prize.dto';
export declare class LotteryController {
    private readonly lotteryService;
    constructor(lotteryService: LotteryService);
    findAllPrizes(): Promise<import("./lottery-prize.entity").LotteryPrize[]>;
    createPrize(dto: CreatePrizeDto): Promise<import("./lottery-prize.entity").LotteryPrize>;
    updatePrize(id: string, dto: UpdatePrizeDto): Promise<import("./lottery-prize.entity").LotteryPrize>;
    removePrize(id: string): Promise<void>;
    draw(req: any): Promise<{
        prize: import("./lottery-prize.entity").LotteryPrize;
        index: number;
    }>;
    getRecords(page: string, pageSize: string): Promise<{
        list: import("./lottery-record.entity").LotteryRecord[];
        total: number;
        page: number;
        pageSize: number;
    }>;
}
