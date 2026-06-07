import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FabricProcessController } from './fabric-process.controller';
import { FabricProcessService } from './fabric-process.service';
import { FabricProcess } from './entity/fabric-process.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FabricProcess])],
  controllers: [FabricProcessController],
  providers: [FabricProcessService],
})
export class FabricProcessModule {}
