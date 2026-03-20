import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NoticeService } from './notice.service';

@ApiTags('通知公告')
@Controller('notice')
export class NoticeController {
  constructor(private readonly service: NoticeService) {}

  @ApiOperation({ summary: '获取启用中的公告（登录用户）' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('active')
  getActive() {
    return this.service.findEnabled();
  }

  @ApiOperation({ summary: '获取公告列表（分页）' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('list')
  findAll(@Query('page') page: string, @Query('pageSize') pageSize: string) {
    return this.service.findAll(+page || 1, +pageSize || 10);
  }

  @ApiOperation({ summary: '创建公告' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() body: any, @Request() req) {
    return this.service.create({ ...body, createdBy: req.user.userId });
  }

  @ApiOperation({ summary: '更新公告' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('update/:id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(+id, body);
  }

  @ApiOperation({ summary: '删除公告' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('delete/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
