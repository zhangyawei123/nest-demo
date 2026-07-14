import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { AdminGuard } from '../common/guards/admin.guard';
import { JdNotificationService } from './jd-notification.service';
import { JdTrendController } from './jd-trend.controller';
import { JdTrendProduct } from './jd-product.entity';
import { JdTrendReport } from './jd-report.entity';
import { JdTrendService } from './jd-trend.service';
import { JdTrendSnapshot } from './jd-snapshot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([JdTrendProduct, JdTrendSnapshot, JdTrendReport]),
    UserModule,
  ],
  controllers: [JdTrendController],
  providers: [JdTrendService, JdNotificationService, AdminGuard],
})
export class JdTrendModule {}
