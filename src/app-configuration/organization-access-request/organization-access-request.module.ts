import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { UserToOranizationMapModule } from 'src/app-configuration/user-to-oranization-map/user-to-oranization-map.module';
import { User } from 'src/users/entities/user.entity';
import { Notification } from 'src/notifications/entity/notification.entity';
import { OrganizationAccessRequestController } from './organization-access-request.controller';
import { OrganizationAccessRequest } from './entity/organization-access-request.entity';
import { OrganizationAccessRequestService } from './organization-access-request.service';
import { UserToOranizationMap } from '../user-to-oranization-map/entity/user-to-oranization-map.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    UserToOranizationMapModule,
    TypeOrmModule.forFeature([
      OrganizationAccessRequest,
      Notification,
      Organization,
      User,
      UserToOranizationMap,
    ]),
  ],
  controllers: [OrganizationAccessRequestController],
  providers: [OrganizationAccessRequestService],
  exports: [OrganizationAccessRequestService],
})
export class OrganizationAccessRequestModule {}
