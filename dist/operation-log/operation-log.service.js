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
exports.OperationLogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const operation_log_entity_1 = require("./operation-log.entity");
let OperationLogService = class OperationLogService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async log(data) {
        const record = this.repo.create(data);
        return this.repo.save(record);
    }
    async findAll(page = 1, pageSize = 20, keyword) {
        const qb = this.repo.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');
        if (keyword?.trim()) {
            qb.where('(log.username LIKE :kw OR log.module LIKE :kw OR log.action LIKE :kw)', {
                kw: `%${keyword.trim()}%`,
            });
        }
        const [list, total] = await qb
            .skip((page - 1) * pageSize)
            .take(pageSize)
            .getManyAndCount();
        return { list, total, page, pageSize };
    }
    async clear() {
        await this.repo.clear();
    }
};
exports.OperationLogService = OperationLogService;
exports.OperationLogService = OperationLogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(operation_log_entity_1.OperationLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], OperationLogService);
//# sourceMappingURL=operation-log.service.js.map