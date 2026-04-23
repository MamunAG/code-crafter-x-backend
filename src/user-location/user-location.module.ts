import { Module } from '@nestjs/common';
import { UserLocationController } from './user-location.controller';
import { UserLocationService } from './user-location.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLocation } from './entities/user-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserLocation])],
  controllers: [UserLocationController],
  providers: [UserLocationService],
  exports: [UserLocationService],
})
export class UserLocationModule { }
