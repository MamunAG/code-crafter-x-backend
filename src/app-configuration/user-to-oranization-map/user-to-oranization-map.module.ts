import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../organization/entity/organization.entity';
import { User } from 'src/users/entities/user.entity';
import { UserToOranizationMapController } from './user-to-oranization-map.controller';
import { UserToOranizationMap } from './entity/user-to-oranization-map.entity';
import { UserToOranizationMapService } from './user-to-oranization-map.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserToOranizationMap, User, Organization])],
  controllers: [UserToOranizationMapController],
  providers: [UserToOranizationMapService],
  exports: [UserToOranizationMapService],
})
export class UserToOranizationMapModule {}
