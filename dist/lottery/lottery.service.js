"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LotteryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lottery_prize_entity_1 = require("./lottery-prize.entity");
const lottery_record_entity_1 = require("./lottery-record.entity");
let LotteryService = class LotteryService {
    prizeRepository;
    recordRepository;
    constructor(prizeRepository, recordRepository) {
        this.prizeRepository = prizeRepository;
        this.recordRepository = recordRepository;
    }
    async findAllPrizes() {
        return this.prizeRepository.find({ order: { sort: 'ASC', id: 'ASC' } });
    }
    async findOnePrize(id) {
        const prize = await this.prizeRepository.findOne({ where: { id } });
        if (!prize)
            throw new common_1.NotFoundException('奖项不存在');
        return prize;
    }
    async createPrize(dto) {
        const prize = this.prizeRepository.create(dto);
        return this.prizeRepository.save(prize);
    }
    async updatePrize(id, dto) {
        await this.findOnePrize(id);
        await this.prizeRepository.update(id, dto);
        return this.findOnePrize(id);
    }
    async removePrize(id) {
        await this.findOnePrize(id);
        await this.prizeRepository.delete(id);
    }
    async draw(userId) {
        const prizes = await this.prizeRepository.find({
            where: { enabled: true },
            order: { sort: 'ASC', id: 'ASC' },
        });
        if (!prizes.length)
            throw new common_1.NotFoundException('暂无可用奖项');
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
};
exports.LotteryService = LotteryService;
exports.LotteryService = LotteryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lottery_prize_entity_1.LotteryPrize)),
    __param(1, (0, typeorm_1.InjectRepository)(lottery_record_entity_1.LotteryRecord)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], LotteryService);
//# sourceMappingURL=lottery.service.js.map