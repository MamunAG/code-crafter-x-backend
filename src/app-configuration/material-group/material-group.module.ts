import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialGroup } from './entity/material-group.entity';
import { MaterialGroupController } from './material-group.controller';
import { MaterialGroupService } from './material-group.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialGroup])],
  controllers: [MaterialGroupController],
  providers: [MaterialGroupService],
  exports: [MaterialGroupService],
})
export class MaterialGroupModule {}
