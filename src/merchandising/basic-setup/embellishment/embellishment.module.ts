import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbellishmentController } from './embellishment.controller';
import { EmbellishmentService } from './embellishment.service';
import { Embellishment } from './entity/embellishment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Embellishment])],
  controllers: [EmbellishmentController],
  providers: [EmbellishmentService],
})
export class EmbellishmentModule {}
