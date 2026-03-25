import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DouyinComment } from './douyin-comment.entity';
import { DouyinCommentService } from './douyin-comment.service';
import { DouyinCommentController } from './douyin-comment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DouyinComment])],
  providers: [DouyinCommentService],
  controllers: [DouyinCommentController],
})
export class DouyinCommentModule {}
