import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CreateJdProductDto } from './dto/create-jd-product.dto';
import { UpdateJdProductDto } from './dto/update-jd-product.dto';
import { JdTrendService } from './jd-trend.service';

@ApiTags('京东商品趋势监控')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/jd-trends')
export class JdTrendController {
  constructor(private readonly jdTrendService: JdTrendService) {}

  @Get('products')
  @ApiOperation({ summary: '获取监控商品列表' })
  listProducts() {
    return this.jdTrendService.listProducts();
  }

  @Post('products')
  @ApiOperation({ summary: '添加监控商品' })
  createProduct(@Body() dto: CreateJdProductDto) {
    return this.jdTrendService.createProduct(dto);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: '修改监控商品' })
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJdProductDto,
  ) {
    return this.jdTrendService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: '删除监控商品' })
  removeProduct(@Param('id', ParseIntPipe) id: number) {
    return this.jdTrendService.removeProduct(id);
  }

  @Post('collect')
  @ApiOperation({ summary: '立即采集并生成今天的报告' })
  collectToday() {
    return this.jdTrendService.collectToday();
  }

  @Get('reports')
  @ApiOperation({ summary: '获取历史报告' })
  listReports(@Query('limit') limit?: string) {
    return this.jdTrendService.listReports(limit ? Number(limit) : 30);
  }

  @Get('reports/latest')
  @ApiOperation({ summary: '获取最新报告' })
  getLatestReport() {
    return this.jdTrendService.getLatestReport();
  }

  @Get('reports/:date')
  @ApiOperation({ summary: '获取指定日期报告' })
  getReport(@Param('date') date: string) {
    return this.jdTrendService.getReport(date);
  }

  @Get('configuration')
  @ApiOperation({ summary: '获取脱敏后的功能配置状态' })
  getConfigurationStatus() {
    return this.jdTrendService.getConfigurationStatus();
  }
}
