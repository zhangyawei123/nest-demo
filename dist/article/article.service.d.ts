import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
export declare class ArticleService {
    private articleRepository;
    constructor(articleRepository: Repository<Article>);
    create(createArticleDto: CreateArticleDto, authorId: number): Promise<Article>;
    findAll(keyword?: string): Promise<Article[]>;
    findOne(id: number): Promise<Article>;
    findByAuthor(authorId: number, keyword?: string): Promise<Article[]>;
    update(id: number, updateArticleDto: UpdateArticleDto, userId: number): Promise<Article>;
    remove(id: number, userId: number): Promise<void>;
}
