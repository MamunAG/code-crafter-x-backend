import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Material } from 'src/app-configuration/material/entity/material.entity';
import { Unit } from 'src/app-configuration/unit/entity/unit.entity';
import { FabricProcess } from 'src/merchandising/master-data/fabric-process/entity/fabric-process.entity';
import { Style } from 'src/merchandising/style/entity/style.entity';
import { FabricCostingCommonProcess } from './entity/fabric-costing-common-process.entity';
import { FabricCostingYarnProcess } from './entity/fabric-costing-yarn-process.entity';
import { FabricCostingYarn } from './entity/fabric-costing-yarn.entity';
import { FabricCosting } from './entity/fabric-costing.entity';
import { FabricCostingController } from './fabric-costing.controller';
import { FabricCostingService } from './fabric-costing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FabricCosting,
      FabricCostingYarn,
      FabricCostingYarnProcess,
      FabricCostingCommonProcess,
      Style,
      Material,
      Unit,
      Currency,
      FabricProcess,
    ]),
  ],
  controllers: [FabricCostingController],
  providers: [FabricCostingService],
})
export class FabricCostingModule {}
