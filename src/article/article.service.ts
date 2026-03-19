import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

/**
 * 文章服务
 */
@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  /**
   * 创建文章
   */
  async create(createArticleDto: CreateArticleDto, authorId: number): Promise<Article> {
    const article = this.articleRepository.create({
      ...createArticleDto,
      authorId,
    });
    return this.articleRepository.save(article);
  }

  /**
   * 获取所有文章列表
   */
  async findAll(): Promise<Article[]> {
    return this.articleRepository.find({
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据 ID 获取文章详情
   */
  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    return article;
  }

  /**
   * 获取当前用户的文章列表
   */
  async findByAuthor(authorId: number): Promise<Article[]> {
    return this.articleRepository.find({
      where: { authorId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 更新文章
   */
  async update(id: number, updateArticleDto: UpdateArticleDto, userId: number): Promise<Article> {
    const article = await this.findOne(id);

    // 只能修改自己的文章
    if (article.authorId !== userId) {
      throw new ForbiddenException('无权修改此文章');
    }

    Object.assign(article, updateArticleDto);
    return this.articleRepository.save(article);
  }

  /**
   * 删除文章
   */
  async remove(id: number, userId: number): Promise<void> {
    const article = await this.findOne(id);

    // 只能删除自己的文章
    if (article.authorId !== userId) {
      throw new ForbiddenException('无权删除此文章');
    }

    await this.articleRepository.remove(article);
  }
}
