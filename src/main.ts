import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const corsOrigin = process.env.CORS_ORIGIN || '';
  const allowedOrigins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // 启用 CORS（允许前端跨域访问）
  app.enableCors({
    origin: !isProduction || allowedOrigins.length === 0 ? true : allowedOrigins,
    credentials: true,
  });

  // 配置静态文件服务 - 提供上传文件访问
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // 全局验证管道（自动验证 DTO，whitelist 过滤多余字段，transform 自动类型转换）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 全局异常过滤器 - 统一错误响应格式
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应拦截器 - 统一返回格式
  app.useGlobalInterceptors(new TransformInterceptor());

  // ────────────────────────────────────────────────────────────
  // Swagger / OpenAPI 配置
  // 访问地址：http://localhost:3000/api-docs
  // JSON 文档：http://localhost:3000/api-docs-json  （可直接在 Apifox 中导入）
  // Apifox 导入方式：项目 → 导入 → URL 导入 → 填入上方 JSON 地址
  // ────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Demo API')          // 项目名称
    .setDescription('用户认证与管理接口文档') // 项目描述
    .setVersion('1.0')                    // 版本号
    .addBearerAuth(                       // 支持 JWT Bearer Token 认证
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '请输入登录后返回的 access_token',
      },
      'JWT',
    )
    .build();

  if (!isProduction || process.env.ENABLE_SWAGGER === 'true') {
    const document = SwaggerModule.createDocument(app, swaggerConfig);

    // /api-docs  → Swagger UI 可视化界面
    SwaggerModule.setup('api-docs', app, document, {
      jsonDocumentUrl: 'api-docs-json', // /api-docs-json 提供 OpenAPI JSON，供 Apifox 导入
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  if (!isProduction || process.env.ENABLE_SWAGGER === 'true') {
    console.log(`📖 Swagger UI:  http://localhost:${port}/api-docs`);
    console.log(`📋 OpenAPI JSON（Apifox 导入地址）: http://localhost:${port}/api-docs-json`);
  }
}
bootstrap();
