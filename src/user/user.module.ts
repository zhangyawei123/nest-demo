import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Role } from '../role/role.entity';
import { Menu } from '../menu/menu.entity';
import { LotteryPrize } from '../lottery/lottery-prize.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Menu, LotteryPrize])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
