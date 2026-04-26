import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as admin from 'firebase-admin';
import { Repository } from 'typeorm';

import { NotificationTypeEnum } from 'src/common/enums/notification-type.enum';
import { Notification } from './entity/notification.entity';
import { UserFirebaseToken } from './entity/user-firebase-token.entity';
import { RegisterFirebaseTokenDto } from './dto/register-firebase-token.dto';

type NotificationPushPayload = {
  title: string;
  body: string;
  link?: string | null;
  type?: NotificationTypeEnum;
  metadata?: Record<string, unknown> | null;
  notificationId?: string;
};

type CreateNotificationPayload = NotificationPushPayload & {
  userId: string;
  createdById?: string | null;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(UserFirebaseToken)
    private readonly firebaseTokenRepository: Repository<UserFirebaseToken>,

    @Inject('FIREBASE_ADMIN')
    private readonly firebaseAdmin: typeof admin,
  ) {}

  async findForUser(userId: string, page = 1, limit = 20) {
    const safePage = Math.max(page || 1, 1);
    const safeLimit = Math.min(Math.max(limit || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    const [items, total, unreadCount] = await Promise.all([
      this.notificationRepository.find({
        where: {
          userId,
        },
        order: {
          created_at: 'DESC',
        },
        skip,
        take: safeLimit,
      }),
      this.notificationRepository.count({
        where: {
          userId,
        },
      }),
      this.notificationRepository.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      items,
      unreadCount,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
        hasNextPage: safePage * safeLimit < total,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      {
        userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return this.findForUser(userId);
  }

  async registerFirebaseToken(userId: string, dto: RegisterFirebaseTokenDto) {
    const normalizedToken = dto.token.trim();

    let tokenRecord = await this.firebaseTokenRepository.findOne({
      where: {
        token: normalizedToken,
      },
    });

    if (!tokenRecord) {
      tokenRecord = this.firebaseTokenRepository.create({
        userId,
        token: normalizedToken,
      });
    }

    tokenRecord.userId = userId;
    tokenRecord.platform = dto.platform?.trim() || 'web';
    tokenRecord.userAgent = dto.userAgent?.trim() || null;
    tokenRecord.lastSeenAt = new Date();
    tokenRecord.updated_by_id = userId;

    if (!tokenRecord.created_by_id) {
      tokenRecord.created_by_id = userId;
    }

    await this.firebaseTokenRepository.save(tokenRecord);

    return {
      registered: true,
    };
  }

  async removeFirebaseToken(userId: string, token: string) {
    await this.firebaseTokenRepository.delete({
      userId,
      token: token.trim(),
    });

    return {
      removed: true,
    };
  }

  async createForUser(payload: CreateNotificationPayload) {
    const notificationRecord = this.notificationRepository.create({
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      link: payload.link || null,
      type: payload.type || NotificationTypeEnum.organization_access_request_decision,
      metadata: payload.metadata || null,
      created_by_id: payload.createdById || undefined,
    });
    const notification = await this.notificationRepository.save(notificationRecord);

    await this.sendPushToUser(payload.userId, {
      ...payload,
      notificationId: notification.id,
    });

    return notification;
  }

  async sendPushToUser(userId: string, payload: NotificationPushPayload) {
    const tokenRecords = await this.firebaseTokenRepository.find({
      where: {
        userId,
      },
    });

    if (!tokenRecords.length) {
      return;
    }

    const tokens = tokenRecords.map((record) => record.token);

    try {
      const response = await this.firebaseAdmin.messaging().sendEachForMulticast({
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: this.buildPushData(payload),
        webpush: {
          fcmOptions: payload.link
            ? {
                link: payload.link,
              }
            : undefined,
        },
      });

      const invalidTokens = response.responses
        .map((result, index) => ({ result, token: tokens[index] }))
        .filter(({ result }) => {
          const code = result.error?.code;
          return (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          );
        })
        .map(({ token }) => token);

      if (invalidTokens.length) {
        await this.firebaseTokenRepository
          .createQueryBuilder()
          .delete()
          .where('token IN (:...tokens)', { tokens: invalidTokens })
          .execute();
      }
    } catch (error) {
      this.logger.error(`Failed to send push notification to user ${userId}`, error as Error);
    }
  }

  private buildPushData(payload: NotificationPushPayload) {
    const data: Record<string, string> = {
      title: payload.title,
      body: payload.body,
      type: payload.type || NotificationTypeEnum.organization_access_request_decision,
    };

    if (payload.link) {
      data.link = payload.link;
    }

    if (payload.notificationId) {
      data.notificationId = payload.notificationId;
    }

    if (payload.metadata) {
      data.metadata = JSON.stringify(payload.metadata);
    }

    return data;
  }
}
