import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ArticleInteractionService } from './article-interaction.service';
import { ArticleIdDto } from './dto/article-id.dto';

@ApiTags('文章互动')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('article-interaction')
export class ArticleInteractionController {
  constructor(private readonly service: ArticleInteractionService) {}

  @ApiOperation({ summary: '获取文章互动状态' })
  @Post('status')
  status(@Body() dto: ArticleIdDto, @Request() req) {
    return this.service.getStatus(req.user.userId, Number(dto.articleId));
  }

  @ApiOperation({ summary: '切换文章收藏状态' })
  @Post('toggle-favorite')
  toggleFavorite(@Body() dto: ArticleIdDto, @Request() req) {
    return this.service.toggleFavorite(req.user.userId, Number(dto.articleId));
  }

  @ApiOperation({ summary: '记录文章阅读历史' })
  @Post('mark-viewed')
  markViewed(@Body() dto: ArticleIdDto, @Request() req) {
    return this.service.markViewed(req.user.userId, Number(dto.articleId));
  }

  @ApiOperation({ summary: '获取我的收藏文章' })
  @Post('favorites')
  favorites(@Request() req) {
    return this.service.favoriteList(req.user.userId);
  }

  @ApiOperation({ summary: '获取我的阅读历史' })
  @Post('history')
  history(@Request() req) {
    return this.service.historyList(req.user.userId);
  }
}
