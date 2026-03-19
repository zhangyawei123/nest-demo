import { Injectable } from '@nestjs/common';

/**
 * 根服务 - 提供应用级别的通用功能
 *
 * 目前仅包含健康检查方法，后续可扩展为全局项目配置、统计信息等接口
 */
@Injectable()
export class AppService {
  /**
   * 健康检查方法
   * @returns 固定欢迎字符串，返回即表示服务正常运行
   */
  getHello(): string {
    return 'Hello World!';
  }
}
