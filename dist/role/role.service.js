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
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("./role.entity");
const menu_entity_1 = require("../menu/menu.entity");
let RoleService = class RoleService {
    roleRepository;
    menuRepository;
    constructor(roleRepository, menuRepository) {
        this.roleRepository = roleRepository;
        this.menuRepository = menuRepository;
    }
    async findAll() {
        return this.roleRepository.find({ relations: ['menus'] });
    }
    async findOne(id) {
        const role = await this.roleRepository.findOne({ where: { id }, relations: ['menus'] });
        if (!role)
            throw new common_1.NotFoundException('角色不存在');
        return role;
    }
    async create(dto) {
        const role = this.roleRepository.create({ name: dto.name, description: dto.description });
        if (dto.menuIds?.length) {
            role.menus = await this.menuRepository.findBy({ id: (0, typeorm_2.In)(dto.menuIds) });
        }
        else {
            role.menus = [];
        }
        return this.roleRepository.save(role);
    }
    async update(id, dto) {
        const role = await this.findOne(id);
        role.name = dto.name ?? role.name;
        role.description = dto.description ?? role.description;
        if (dto.menuIds !== undefined) {
            role.menus = dto.menuIds.length
                ? await this.menuRepository.findBy({ id: (0, typeorm_2.In)(dto.menuIds) })
                : [];
        }
        return this.roleRepository.save(role);
    }
    async remove(id) {
        await this.findOne(id);
        await this.roleRepository.delete(id);
    }
    async assignMenus(id, menuIds) {
        const role = await this.findOne(id);
        role.menus = menuIds.length
            ? await this.menuRepository.findBy({ id: (0, typeorm_2.In)(menuIds) })
            : [];
        return this.roleRepository.save(role);
    }
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(menu_entity_1.Menu)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RoleService);
//# sourceMappingURL=role.service.js.map