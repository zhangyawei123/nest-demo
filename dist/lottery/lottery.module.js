"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LotteryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const lottery_prize_entity_1 = require("./lottery-prize.entity");
const lottery_record_entity_1 = require("./lottery-record.entity");
const lottery_service_1 = require("./lottery.service");
const lottery_controller_1 = require("./lottery.controller");
let LotteryModule = class LotteryModule {
};
exports.LotteryModule = LotteryModule;
exports.LotteryModule = LotteryModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([lottery_prize_entity_1.LotteryPrize, lottery_record_entity_1.LotteryRecord])],
        controllers: [lottery_controller_1.LotteryController],
        providers: [lottery_service_1.LotteryService],
    })
], LotteryModule);
//# sourceMappingURL=lottery.module.js.map