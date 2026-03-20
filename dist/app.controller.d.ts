import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    getDashboardOverview(req: any): Promise<{
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
        recentArticles: import("./article/article.entity").Article[];
        systemStatus: string;
    }>;
}
