import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleInteraction } from './article-interaction.entity';
import { Article } from '../article/article.entity';

@Injectable()
export class ArticleInteractionService {
  constructor(
    @InjectRepository(ArticleInteraction)
    private readonly interactionRepo: Repository<ArticleInteraction>,
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  async getStatus(userId: number, articleId: number) {
    await this.ensureArticle(articleId);
    const interaction = await this.findInteraction(userId, articleId);
    return {
      articleId,
      isFavorite: !!interaction?.isFavorite,
      viewedAt: interaction?.viewedAt || null,
    };
  }

  async toggleFavorite(userId: number, articleId: number) {
    await this.ensureArticle(articleId);
    const interaction = await this.getOrCreateInteraction(userId, articleId);
    interaction.isFavorite = !interaction.isFavorite;
    const saved = await this.interactionRepo.save(interaction);
    return {
      articleId,
      isFavorite: saved.isFavorite,
    };
  }

  async markViewed(userId: number, articleId: number) {
    await this.ensureArticle(articleId);
    const interaction = await this.getOrCreateInteraction(userId, articleId);
    interaction.viewedAt = new Date();
    await this.interactionRepo.save(interaction);
    return { articleId, viewedAt: interaction.viewedAt };
  }

  async favoriteList(userId: number) {
    const list = await this.interactionRepo.find({
      where: { userId, isFavorite: true },
      relations: ['article', 'article.author'],
      order: { updatedAt: 'DESC' },
    });
    return list.map((item) => item.article).filter(Boolean);
  }

  async historyList(userId: number) {
    const list = await this.interactionRepo
      .createQueryBuilder('interaction')
      .leftJoinAndSelect('interaction.article', 'article')
      .leftJoinAndSelect('article.author', 'author')
      .where('interaction.userId = :userId', { userId })
      .andWhere('interaction.viewedAt IS NOT NULL')
      .orderBy('interaction.viewedAt', 'DESC')
      .getMany();
    return list.map((item) => ({
      ...item.article,
      viewedAt: item.viewedAt,
    })).filter((item) => item.id);
  }

  private async ensureArticle(articleId: number) {
    if (!articleId || Number.isNaN(articleId)) {
      throw new NotFoundException('文章不存在');
    }
    const article = await this.articleRepo.findOne({ where: { id: articleId } });
    if (!article) {
      throw new NotFoundException('文章不存在');
    }
    return article;
  }

  private findInteraction(userId: number, articleId: number) {
    return this.interactionRepo.findOne({ where: { userId, articleId } });
  }

  private async getOrCreateInteraction(userId: number, articleId: number) {
    const existed = await this.findInteraction(userId, articleId);
    if (existed) return existed;
    return this.interactionRepo.create({
      userId,
      articleId,
      isFavorite: false,
      viewedAt: null,
    });
  }
}
