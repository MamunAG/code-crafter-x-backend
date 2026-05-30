import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GmtCostScope } from './entity/gmt-cost-scope.entity';
import { GmtCostScopeController } from './gmt-cost-scope.controller';
import { GmtCostScopeService } from './gmt-cost-scope.service';

@Module({
  imports: [TypeOrmModule.forFeature([GmtCostScope])],
  controllers: [GmtCostScopeController],
  providers: [GmtCostScopeService],
})
export class GmtCostScopeModule {}
