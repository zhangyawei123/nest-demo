import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * 根控制器 - 提供应用健康检查等基础接口
 *
 * 接口列表：
 *   GET / - 服务健康检查，返回欢迎语
 */
@ApiTags('基础')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 健康检查接口
   * GET /
   * 无需登录，用于确认服务是否正常运行
   */
  @ApiOperation({ summary: '健康检查', description: '确认服务是否正常运行' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
