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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const article_entity_1 = require("./article/article.entity");
const menu_entity_1 = require("./menu/menu.entity");
const role_entity_1 = require("./role/role.entity");
const user_entity_1 = require("./user/user.entity");
let AppService = class AppService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    getHello() {
        return 'Hello World!';
    }
    async getDashboardOverview(userId) {
        const userRepository = this.dataSource.getRepository(user_entity_1.User);
        const articleRepository = this.dataSource.getRepository(article_entity_1.Article);
        const roleRepository = this.dataSource.getRepository(role_entity_1.Role);
        const menuRepository = this.dataSource.getRepository(menu_entity_1.Menu);
        const [currentUser, userCount, articleCount, roleCount, menuCount, myArticleCount, recentArticles] = await Promise.all([
            userRepository.findOne({ where: { id: userId } }),
            userRepository.count(),
            articleRepository.count(),
            roleRepository.count(),
            menuRepository.count(),
            articleRepository.count({ where: { authorId: userId } }),
            articleRepository.find({
                relations: ['author'],
                order: { createdAt: 'DESC' },
                take: 5,
            }),
        ]);
        return {
            user: {
                id: currentUser?.id ?? userId,
                username: currentUser?.username ?? '',
                roleNames: currentUser?.roles?.map((role) => role.name) ?? [],
            },
            stats: {
                userCount,
                articleCount,
                roleCount,
                menuCount,
                myArticleCount,
            },
            recentArticles,
            systemStatus: 'online',
        };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], AppService);
//# sourceMappingURL=app.service.js.map