import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
export declare class ArticleController {
    private readonly articleService;
    constructor(articleService: ArticleService);
    create(createArticleDto: CreateArticleDto, req: any): Promise<import("./article.entity").Article>;
    findAll(): Promise<import("./article.entity").Article[]>;
    findMyArticles(req: any): Promise<import("./article.entity").Article[]>;
    findOne(id: string): Promise<import("./article.entity").Article>;
    update(id: string, updateArticleDto: UpdateArticleDto, req: any): Promise<import("./article.entity").Article>;
    remove(id: string, req: any): Promise<void>;
}
