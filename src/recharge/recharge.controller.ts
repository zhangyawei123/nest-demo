import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { RechargeService } from './recharge.service';
import { CreateRechargeOrderDto } from './dto/create-recharge-order.dto';
import { CreateRechargePackageDto } from './dto/create-recharge-package.dto';
import { UpdateRechargePackageDto } from './dto/update-recharge-package.dto';
import { ListRechargeOrderDto } from './dto/list-recharge-order.dto';
import { ConfirmRechargeOrderDto } from './dto/confirm-recharge-order.dto';
import { RequestRechargeRefundDto } from './dto/request-recharge-refund.dto';
import { ReviewRechargeRefundDto } from './dto/review-recharge-refund.dto';

@Controller('recharge')
@UseGuards(JwtAuthGuard)
export class RechargeController {
  constructor(private readonly rechargeService: RechargeService) {}

  @Get('packages')
  listPackages() {
    return this.rechargeService.listEnabledPackages();
  }

  @Post('orders')
  createOrder(@Request() req, @Body() dto: CreateRechargeOrderDto) {
    return this.rechargeService.createOrder(req.user.userId, dto.packageId);
  }

  @Get('orders/my')
  listMyOrders(@Request() req, @Query() query: ListRechargeOrderDto) {
    return this.rechargeService.listMyOrders(req.user.userId, query);
  }

  @Post('orders/:id/payment-proof')
  @UseInterceptors(FileInterceptor('file'))
  submitPaymentProof(
    @Request() req,
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('请选择支付凭证');
    return this.rechargeService.submitPaymentProof(
      req.user.userId,
      Number(id),
      file,
    );
  }

  @Post('orders/:id/refund')
  requestRefund(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RequestRechargeRefundDto,
  ) {
    return this.rechargeService.requestRefund(
      req.user.userId,
      Number(id),
      dto.reason,
    );
  }

  @Get('orders/:id/events')
  listOrderEvents(@Request() req, @Param('id') id: string) {
    return this.rechargeService.listOrderEvents(Number(id), req.user.userId);
  }

  @Post('orders/:id/cancel')
  cancelMyOrder(@Request() req, @Param('id') id: string) {
    return this.rechargeService.cancelOrder(Number(id), req.user.userId);
  }
}

@Controller('admin/recharge')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminRechargeController {
  constructor(private readonly rechargeService: RechargeService) {}

  @Get('packages')
  listPackages() {
    return this.rechargeService.listPackages();
  }

  @Post('packages')
  createPackage(@Body() dto: CreateRechargePackageDto) {
    return this.rechargeService.createPackage(dto);
  }

  @Post('packages/:id')
  updatePackage(
    @Param('id') id: string,
    @Body() dto: UpdateRechargePackageDto,
  ) {
    return this.rechargeService.updatePackage(Number(id), dto);
  }

  @Get('orders')
  listOrders(@Query() query: ListRechargeOrderDto) {
    return this.rechargeService.listAdminOrders(query);
  }

  @Get('orders/export')
  exportOrders(@Query() query: ListRechargeOrderDto) {
    return this.rechargeService.listAdminOrdersForExport(query);
  }

  @Post('orders/:id/confirm')
  confirmOrder(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ConfirmRechargeOrderDto,
  ) {
    return this.rechargeService.confirmOrder(
      Number(id),
      req.user.userId,
      dto.remark,
    );
  }

  @Post('orders/:id/cancel')
  cancelOrder(@Param('id') id: string) {
    return this.rechargeService.cancelOrder(Number(id));
  }

  @Post('orders/:id/refund/review')
  reviewRefund(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReviewRechargeRefundDto,
  ) {
    return this.rechargeService.reviewRefund(
      Number(id),
      req.user.userId,
      dto.approved,
      dto.remark,
    );
  }

  @Get('orders/:id/events')
  listOrderEvents(@Param('id') id: string) {
    return this.rechargeService.listOrderEvents(Number(id));
  }
}
