import { DataSource } from 'typeorm';
import { Article } from './article/article.entity';
export declare class AppService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    getHello(): string;
    getDashboardOverview(userId: number): Promise<{
        user: {
            id: number;
            username: string;
            roleNames: string[];
        };
        stats: {
            userCount: number;
            articleCount: number;
            roleCount: number;
            menuCount: number;
            myArticleCount: number;
        };
        recentArticles: Article[];
        systemStatus: string;
    }>;
}
