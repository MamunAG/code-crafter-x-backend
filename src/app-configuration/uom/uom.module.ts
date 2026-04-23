import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Uom } from './entity/uom.entity';
import { UomController } from './uom.controller';
import { UomService } from './uom.service';

@Module({
  imports: [TypeOrmModule.forFeature([Uom])],
  controllers: [UomController],
  providers: [UomService],
})
export class UomModule {}
