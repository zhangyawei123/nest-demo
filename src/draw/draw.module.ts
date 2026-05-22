import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DrawController } from './draw.controller';
import { DrawGeneration } from './draw-generation.entity';
import { DrawService } from './draw.service';

@Module({
  imports: [TypeOrmModule.forFeature([DrawGeneration])],
  controllers: [DrawController],
  providers: [DrawService],
})
export class DrawModule {}
