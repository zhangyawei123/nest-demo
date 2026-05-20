import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { UpdateFeedbackStatusDto } from './dto/update-feedback-status.dto';
import { DeleteFeedbackDto } from './dto/delete-feedback.dto';

@ApiTags('意见反馈')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @ApiOperation({ summary: '提交意见反馈' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() dto: CreateFeedbackDto, @Request() req) {
    return this.service.create(dto, req.user);
  }

  @ApiOperation({ summary: '获取反馈列表' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('list')
  findAll(@Query() query: QueryFeedbackDto) {
    return this.service.findAll(query);
  }

  @ApiOperation({ summary: '更新反馈状态' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('update-status')
  updateStatus(@Body() dto: UpdateFeedbackStatusDto) {
    return this.service.updateStatus(Number(dto.id), dto.status);
  }

  @ApiOperation({ summary: '删除反馈' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('delete')
  remove(@Body() dto: DeleteFeedbackDto) {
    return this.service.remove(Number(dto.id));
  }
}
