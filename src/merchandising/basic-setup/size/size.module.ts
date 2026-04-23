import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SizeController } from './size.controller';
import { SizeService } from './size.service';
import { Size } from './entity/size.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Size])],
  controllers: [SizeController],
  providers: [SizeService]
})
export class SizeModule {}
