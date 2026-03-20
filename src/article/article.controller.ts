import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 文章控制器
 */
@ApiTags('文章管理')
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  /**
   * 发布文章
   */
  @ApiOperation({ summary: '发布文章' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() createArticleDto: CreateArticleDto, @Request() req) {
    return this.articleService.create(createArticleDto, req.user.userId);
  }

  /**
   * 获取所有文章列表
   */
  @ApiOperation({ summary: '获取所有文章列表' })
  @Get('list')
  findAll(@Query('keyword') keyword?: string) {
    return this.articleService.findAll(keyword);
  }

  /**
   * 获取我的文章列表
   */
  @ApiOperation({ summary: '获取我的文章列表' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('my-list')
  findMyArticles(@Request() req, @Query('keyword') keyword?: string) {
    return this.articleService.findByAuthor(req.user.userId, keyword);
  }

  /**
   * 获取文章详情
   */
  @ApiOperation({ summary: '获取文章详情' })
  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.articleService.findOne(+id);
  }

  /**
   * 更新文章（使用 POST 代替 PUT）
   */
  @ApiOperation({ summary: '更新文章' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Request() req,
  ) {
    return this.articleService.update(+id, updateArticleDto, req.user.userId);
  }

  /**
   * 删除文章（使用 POST 代替 DELETE）
   */
  @ApiOperation({ summary: '删除文章' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('delete/:id')
  remove(@Param('id') id: string, @Request() req) {
    return this.articleService.remove(+id, req.user.userId);
  }
}
