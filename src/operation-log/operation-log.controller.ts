import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OperationLogService } from './operation-log.service';

@ApiTags('操作日志')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('operation-log')
export class OperationLogController {
  constructor(private readonly service: OperationLogService) {}

  @ApiOperation({ summary: '获取操作日志列表' })
  @Get('list')
  findAll(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.service.findAll(+page || 1, +pageSize || 20, keyword);
  }

  @ApiOperation({ summary: '清空操作日志' })
  @Post('clear')
  clear() {
    return this.service.clear();
  }
}
