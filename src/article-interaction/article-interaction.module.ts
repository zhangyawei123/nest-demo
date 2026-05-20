import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleInteraction } from './article-interaction.entity';
import { Article } from '../article/article.entity';
import { ArticleInteractionService } from './article-interaction.service';
import { ArticleInteractionController } from './article-interaction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleInteraction, Article])],
  providers: [ArticleInteractionService],
  controllers: [ArticleInteractionController],
})
export class ArticleInteractionModule {}
