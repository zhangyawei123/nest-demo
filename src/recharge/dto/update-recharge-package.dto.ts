import { PartialType } from '@nestjs/swagger';
import { CreateRechargePackageDto } from './create-recharge-package.dto';

export class UpdateRechargePackageDto extends PartialType(
  CreateRechargePackageDto,
) {}
