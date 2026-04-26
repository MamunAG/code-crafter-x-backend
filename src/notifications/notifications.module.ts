import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FirebaseProvider } from 'src/lib/firebase.provider';
import { Notification } from './entity/notification.entity';
import { UserFirebaseToken } from './entity/user-firebase-token.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, UserFirebaseToken])],
  controllers: [NotificationsController],
  providers: [FirebaseProvider, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
