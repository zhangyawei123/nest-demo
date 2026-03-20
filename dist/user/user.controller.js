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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_service_1 = require("./user.service");
const update_user_dto_1 = require("./dto/update-user.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const role_entity_1 = require("../role/role.entity");
const menu_entity_1 = require("../menu/menu.entity");
let UserController = class UserController {
    userService;
    roleRepository;
    menuRepository;
    constructor(userService, roleRepository, menuRepository) {
        this.userService = userService;
        this.roleRepository = roleRepository;
        this.menuRepository = menuRepository;
    }
    getUserList(keyword) {
        return this.userService.findAll(keyword);
    }
    async getUserById(id) {
        const user = await this.userService.findById(+id);
        const { password, ...result } = user;
        return result;
    }
    async getMyMenus(req) {
        return this.userService.getMenusByUserId(req.user.userId);
    }
    async updateUser(id, updateUserDto, req) {
        const userId = +id;
        if (req.user.userId !== userId) {
            throw new common_1.ForbiddenException('只能修改自己的信息');
        }
        return this.userService.update(userId, updateUserDto);
    }
    assignRoles(id, roleIds = []) {
        return this.userService.assignRoleIds(+id, roleIds);
    }
    async resetAdminPassword() {
        const admin = await this.userService.findByUsername('admin');
        if (!admin) {
            return { message: 'admin 用户不存在' };
        }
        await this.userService.update(admin.id, { password: '21232f297a57a5a743894a0e4a801fc3' });
        return { message: 'admin 密码已重置为 admin (MD5)' };
    }
    async seed() {
        const topMenus = [
            { name: '仪表盘', path: '/', component: 'dashboard/DashboardView', icon: 'HomeFilled', sort: 0 },
            { name: '文章管理', path: '/articles', component: 'article/ArticleListView', icon: 'Document', sort: 1 },
            { name: '用户管理', path: '/users', component: 'user/UsersView', icon: 'User', sort: 2 },
            { name: '角色管理', path: '/roles', component: 'role/RoleView', icon: 'UserFilled', sort: 3 },
            { name: '菜单管理', path: '/menus', component: 'menu/MenuView', icon: 'Grid', sort: 4 },
            { name: '幸运转盘', path: '/lottery', component: 'lottery/LotteryView', icon: 'Opportunity', sort: 5 },
        ];
        const savedMenus = [];
        for (const m of topMenus) {
            let menu = await this.menuRepository.findOne({ where: { path: m.path } });
            if (!menu) {
                menu = this.menuRepository.create({ ...m, visible: true });
                menu = await this.menuRepository.save(menu);
            }
            savedMenus.push(menu);
        }
        const articleMenu = savedMenus.find(m => m.path === '/articles');
        if (articleMenu) {
            const articleSubMenus = [
                { name: '发布文章', path: 'create', component: 'article/ArticleEditView', icon: '', sort: 0, visible: false, parentId: articleMenu.id },
                { name: '编辑文章', path: 'edit', component: 'article/ArticleEditView', icon: '', sort: 1, visible: false, parentId: articleMenu.id },
                { name: '文章详情', path: 'detail', component: 'article/ArticleDetailView', icon: '', sort: 2, visible: false, parentId: articleMenu.id },
            ];
            for (const m of articleSubMenus) {
                let menu = await this.menuRepository.findOne({ where: { name: m.name } });
                if (!menu) {
                    menu = this.menuRepository.create(m);
                    menu = await this.menuRepository.save(menu);
                }
                else {
                    Object.assign(menu, m);
                    menu = await this.menuRepository.save(menu);
                }
                savedMenus.push(menu);
            }
        }
        let adminRole = await this.roleRepository.findOne({ where: { name: 'admin' }, relations: ['menus'] });
        if (!adminRole) {
            adminRole = this.roleRepository.create({ name: 'admin', description: '超级管理员，拥有所有权限' });
        }
        const allMenus = await this.menuRepository.find();
        adminRole.menus = allMenus;
        await this.roleRepository.save(adminRole);
        const adminUser = await this.userService.findByUsername('admin');
        if (adminUser) {
            await this.userService.assignRoles(adminUser.id, [adminRole]);
        }
        return { message: '初始化完成', menus: allMenus.length, role: adminRole.name };
    }
};
exports.UserController = UserController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取用户列表' }),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)('keyword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "getUserList", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '查询用户信息' }),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('detail/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserById", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '获取当前用户的菜单列表' }),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('menus'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getMyMenus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '修改用户信息' }),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('update/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '分配角色给用户' }),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('assign-roles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('roleIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", void 0)
], UserController.prototype, "assignRoles", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '重置 admin 密码为 admin（临时接口）' }),
    (0, common_1.Post)('reset-admin-password'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "resetAdminPassword", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: '初始化菜单数据并给 admin 分配最高权限（仅首次使用）' }),
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "seed", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('用户管理'),
    (0, common_1.Controller)('user'),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(menu_entity_1.Menu)),
    __metadata("design:paramtypes", [user_service_1.UserService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UserController);
//# sourceMappingURL=user.controller.js.map