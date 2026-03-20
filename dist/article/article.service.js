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
exports.ArticleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const article_entity_1 = require("./article.entity");
let ArticleService = class ArticleService {
    articleRepository;
    constructor(articleRepository) {
        this.articleRepository = articleRepository;
    }
    async create(createArticleDto, authorId) {
        const article = this.articleRepository.create({
            ...createArticleDto,
            authorId,
        });
        return this.articleRepository.save(article);
    }
    async findAll(keyword) {
        const queryBuilder = this.articleRepository
            .createQueryBuilder('article')
            .leftJoinAndSelect('article.author', 'author')
            .orderBy('article.createdAt', 'DESC');
        if (keyword?.trim()) {
            queryBuilder.andWhere('(article.title LIKE :keyword OR article.content LIKE :keyword)', {
                keyword: `%${keyword.trim()}%`,
            });
        }
        return queryBuilder.getMany();
    }
    async findOne(id) {
        const article = await this.articleRepository.findOne({
            where: { id },
            relations: ['author'],
        });
        if (!article) {
            throw new common_1.NotFoundException('文章不存在');
        }
        return article;
    }
    async findByAuthor(authorId, keyword) {
        const queryBuilder = this.articleRepository
            .createQueryBuilder('article')
            .leftJoinAndSelect('article.author', 'author')
            .where('article.authorId = :authorId', { authorId })
            .orderBy('article.createdAt', 'DESC');
        if (keyword?.trim()) {
            queryBuilder.andWhere('(article.title LIKE :keyword OR article.content LIKE :keyword)', {
                keyword: `%${keyword.trim()}%`,
            });
        }
        return queryBuilder.getMany();
    }
    async update(id, updateArticleDto, userId) {
        const article = await this.findOne(id);
        if (article.authorId !== userId) {
            throw new common_1.ForbiddenException('无权修改此文章');
        }
        Object.assign(article, updateArticleDto);
        return this.articleRepository.save(article);
    }
    async remove(id, userId) {
        const article = await this.findOne(id);
        if (article.authorId !== userId) {
            throw new common_1.ForbiddenException('无权删除此文章');
        }
        await this.articleRepository.remove(article);
    }
};
exports.ArticleService = ArticleService;
exports.ArticleService = ArticleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(article_entity_1.Article)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ArticleService);
//# sourceMappingURL=article.service.js.map