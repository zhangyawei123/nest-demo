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
exports.LotteryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const lottery_service_1 = require("./lottery.service");
const create_prize_dto_1 = require("./dto/create-prize.dto");
const update_prize_dto_1 = require("./dto/update-prize.dto");
let LotteryController = class LotteryController {
    lotteryService;
    constructor(lotteryService) {
        this.lotteryService = lotteryService;
    }
    findAllPrizes() {
        return this.lotteryService.findAllPrizes();
    }
    createPrize(dto) {
        return this.lotteryService.createPrize(dto);
    }
    updatePrize(id, dto) {
        return this.lotteryService.updatePrize(+id, dto);
    }
    removePrize(id) {
        return this.lotteryService.removePrize(+id);
    }
    async draw(req) {
        const userId = req.user?.userId;
        return this.lotteryService.draw(userId);
    }
    getRecords(page, pageSize) {
        return this.lotteryService.getRecords(+page || 1, +pageSize || 10);
    }
};
exports.LotteryController = LotteryController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取所有奖项' }),
    (0, common_1.Get)('prizes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LotteryController.prototype, "findAllPrizes", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '创建奖项' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('prizes/create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_prize_dto_1.CreatePrizeDto]),
    __metadata("design:returntype", void 0)
], LotteryController.prototype, "createPrize", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '更新奖项' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('prizes/update/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_prize_dto_1.UpdatePrizeDto]),
    __metadata("design:returntype", void 0)
], LotteryController.prototype, "updatePrize", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '删除奖项' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('prizes/delete/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LotteryController.prototype, "removePrize", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '执行抽奖' }),
    (0, common_1.Post)('draw'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LotteryController.prototype, "draw", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取抽奖记录' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('records'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LotteryController.prototype, "getRecords", null);
exports.LotteryController = LotteryController = __decorate([
    (0, swagger_1.ApiTags)('抽奖管理'),
    (0, common_1.Controller)('lottery'),
    __metadata("design:paramtypes", [lottery_service_1.LotteryService])
], LotteryController);
//# sourceMappingURL=lottery.controller.js.map