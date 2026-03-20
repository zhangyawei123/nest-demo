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
exports.OperationLogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const operation_log_service_1 = require("./operation-log.service");
let OperationLogController = class OperationLogController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(page, pageSize, keyword) {
        return this.service.findAll(+page || 1, +pageSize || 20, keyword);
    }
    clear() {
        return this.service.clear();
    }
};
exports.OperationLogController = OperationLogController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取操作日志列表' }),
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('keyword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OperationLogController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '清空操作日志' }),
    (0, common_1.Post)('clear'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OperationLogController.prototype, "clear", null);
exports.OperationLogController = OperationLogController = __decorate([
    (0, swagger_1.ApiTags)('操作日志'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('operation-log'),
    __metadata("design:paramtypes", [operation_log_service_1.OperationLogService])
], OperationLogController);
//# sourceMappingURL=operation-log.controller.js.map