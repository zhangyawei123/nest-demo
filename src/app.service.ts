import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Article } from './article/article.entity';
import { Menu } from './menu/menu.entity';
import { Role } from './role/role.entity';
import { User } from './user/user.entity';

/**
 * 根服务 - 提供应用级别的通用功能
 *
 * 目前仅包含健康检查方法，后续可扩展为全局项目配置、统计信息等接口
 */
@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 健康检查方法
   * @returns 固定欢迎字符串，返回即表示服务正常运行
   */
  getHello(): string {
    return 'Hello World!';
  }

  async getDashboardOverview(userId: number) {
    const userRepository = this.dataSource.getRepository(User);
    const articleRepository = this.dataSource.getRepository(Article);
    const roleRepository = this.dataSource.getRepository(Role);
    const menuRepository = this.dataSource.getRepository(Menu);

    const [currentUser, userCount, articleCount, roleCount, menuCount, myArticleCount, recentArticles] =
      await Promise.all([
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
}
