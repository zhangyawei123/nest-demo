import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ArticleModule } from './article/article.module';
import { UploadModule } from './upload/upload.module';
import { MenuModule } from './menu/menu.module';
import { RoleModule } from './role/role.module';
import { LotteryModule } from './lottery/lottery.module';
import { OperationLogModule } from './operation-log/operation-log.module';
import { NoticeModule } from './notice/notice.module';

/**
 * 根模块 - 应用程序的入口模块
 *
 * 负责组织所有子模块并完成全局配置：
 *   1. ConfigModule  - 读取 .env 文件中的环境变量（全局可用）
 *   2. TypeOrmModule - 连接本地 MySQL 数据库，开发环境自动同步表结构
 *   3. UserModule    - 用户管理模块（注册、查询、修改）
 *   4. AuthModule    - 认证模块（登录、验证码、JWT）
 *
 * 数据库配置读取自 .env 文件：
 *   DB_HOST     = 127.0.0.1
 *   DB_PORT     = 3306
 *   DB_USERNAME = root
 *   DB_PASSWORD = 
 *   DB_DATABASE = nest_demo
 */
@Module({
  imports: [
    // 配置模块 - 加载根目录下的 .env 文件，isGlobal:true 使全局可通过 ConfigService 注入
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 数据库模块 - 异步读取环境变量后再连接 MySQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        // 自动扫描所有 *.entity.ts / *.entity.js 文件
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // 开发环境：自动同步实体到数据库表结构（生产环境务必设为 false）
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    // 用户模块
    UserModule,
    // 认证模块
    AuthModule,
    ArticleModule,
    UploadModule,
    MenuModule,
    RoleModule,
    LotteryModule,
    OperationLogModule,
    NoticeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
