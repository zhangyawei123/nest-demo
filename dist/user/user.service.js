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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserService = class UserService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async create(createUserDto) {
        const existingUser = await this.userRepository.findOne({
            where: { username: createUserDto.username },
        });
        if (existingUser) {
            throw new common_1.ConflictException('用户名已存在');
        }
        const user = this.userRepository.create(createUserDto);
        return this.userRepository.save(user);
    }
    async findByUsername(username) {
        return this.userRepository.findOne({ where: { username }, relations: ['roles', 'roles.menus'] });
    }
    async findById(id) {
        const user = await this.userRepository.findOne({ where: { id }, relations: ['roles', 'roles.menus'] });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        return user;
    }
    async getMenusByUserId(id) {
        const user = await this.findById(id);
        const menuMap = new Map();
        for (const role of (user.roles || [])) {
            for (const menu of (role.menus || [])) {
                menuMap.set(menu.id, menu);
            }
        }
        const menus = Array.from(menuMap.values());
        menus.sort((a, b) => a.sort - b.sort);
        return menus;
    }
    async assignRoles(id, roles) {
        const user = await this.findById(id);
        user.roles = roles;
        return this.userRepository.save(user);
    }
    async update(id, updateUserDto) {
        const user = await this.findById(id);
        Object.assign(user, updateUserDto);
        return this.userRepository.save(user);
    }
    async validatePassword(md5Password, storedPassword) {
        return md5Password === storedPassword;
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UserService);
//# sourceMappingURL=user.service.js.map