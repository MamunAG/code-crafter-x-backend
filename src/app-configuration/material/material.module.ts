import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialGroup } from '../material-group/entity/material-group.entity';
import { Unit } from '../unit/entity/unit.entity';
import { Material } from './entity/material.entity';
import { MaterialController } from './material.controller';
import { MaterialService } from './material.service';

@Module({
  imports: [TypeOrmModule.forFeature([Material, MaterialGroup, Unit])],
  controllers: [MaterialController],
  providers: [MaterialService],
})
export class MaterialModule {}
