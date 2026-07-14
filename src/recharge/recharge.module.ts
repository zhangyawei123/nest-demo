import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsModule } from '../points/points.module';
import { UserModule } from '../user/user.module';
import { AdminGuard } from '../common/guards/admin.guard';
import { RechargePackage } from './recharge-package.entity';
import { RechargeOrder } from './recharge-order.entity';
import { RechargeOrderEvent } from './recharge-order-event.entity';
import {
  AdminRechargeController,
  RechargeController,
} from './recharge.controller';
import { RechargeService } from './recharge.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RechargePackage,
      RechargeOrder,
      RechargeOrderEvent,
    ]),
    PointsModule,
    UserModule,
  ],
  controllers: [RechargeController, AdminRechargeController],
  providers: [RechargeService, AdminGuard],
})
export class RechargeModule {}
