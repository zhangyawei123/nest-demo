import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { DouyinCommentService } from './douyin-comment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('douyin-comment')
@UseGuards(JwtAuthGuard)
export class DouyinCommentController {
  constructor(private readonly commentService: DouyinCommentService) {}

  @Get()
  async getComments(@Query('url') url: string) {
    const data = await this.commentService.getCommentsByUrl(url);
    return { code: 200, message: '成功', data };
  }

  @Post('fetch')
  async fetchComments(@Query('url') url: string) {
    const data = await this.commentService.fetchAndSaveComments(url);
    return { code: 200, message: '抓取成功', data };
  }
}
