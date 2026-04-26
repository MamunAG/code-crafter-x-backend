import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { NotificationTypeEnum } from 'src/common/enums/notification-type.enum';
import { OrganizationAccessRequestStatusEnum } from 'src/common/enums/organization-access-request-status.enum';
import { RolesEnum } from 'src/common/enums/role.enum';
import { EmailService } from 'src/auth/email.service';
import { User } from 'src/users/entities/user.entity';
import { UserToOranizationMap } from '../user-to-oranization-map/entity/user-to-oranization-map.entity';
import { ApproveOrganizationAccessRequestDto } from './dto/approve-organization-access-request.dto';
import { CreateOrganizationAccessRequestDto } from './dto/create-organization-access-request.dto';
import { RejectOrganizationAccessRequestDto } from './dto/reject-organization-access-request.dto';
import { OrganizationAccessRequest } from './entity/organization-access-request.entity';
import { Notification } from 'src/notifications/entity/notification.entity';
import { NotificationsService } from 'src/notifications/notifications.service';

type OrganizationApprovalDetail = {
  organizationId: string;
  organizationName: string;
  role: RolesEnum;
};

type OrganizationAdminRecipient = {
  userId: string;
  email: string;
  name: string;
  organizationDetails: OrganizationApprovalDetail[];
};

@Injectable()
export class OrganizationAccessRequestService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(OrganizationAccessRequest)
    private readonly accessRequestRepository: Repository<OrganizationAccessRequest>,

    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserToOranizationMap)
    private readonly mappingRepository: Repository<UserToOranizationMap>,

    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async create(requestedByUserId: string, dto: CreateOrganizationAccessRequestDto) {
    const requester = await this.findUserOrFail(requestedByUserId);
    const targetAdmin = await this.findUserByEmailOrFail(dto.adminEmail);

    if (requester.id === targetAdmin.id) {
      throw new BadRequestException(
        'You cannot send an access request to your own account. Please choose another admin email.',
      );
    }

    const targetAdminOrganizationIds = await this.findAdminOrganizationIds(targetAdmin.id);

    if (!targetAdminOrganizationIds.length) {
      throw new BadRequestException('The selected admin is not allowed to manage any organization');
    }

    const existingPendingRequest = await this.accessRequestRepository.findOne({
      where: {
        requestedByUserId,
        requestedAdminUserId: targetAdmin.id,
        status: OrganizationAccessRequestStatusEnum.pending,
      },
    });

    if (existingPendingRequest) {
      throw new BadRequestException('You already have a pending request for this admin');
    }

    const reviewLink = this.getAdminReviewLink();
    const adminNotificationPayload = {
      created_by_id: requestedByUserId,
      userId: targetAdmin.id,
      title: 'Organization access request',
      body: `${requester.name} requested access and sent the request to your email.`,
      link: reviewLink,
      type: NotificationTypeEnum.organization_access_request,
      metadata: {
        requesterId: requestedByUserId,
        requesterName: requester.name,
        targetAdminId: targetAdmin.id,
        targetAdminEmail: targetAdmin.email,
      },
    };
    const savedRequest = await this.dataSource.transaction(async (manager) => {
      const requestRepository = manager.getRepository(OrganizationAccessRequest);
      const notificationRepository = manager.getRepository(Notification);

      const request = requestRepository.create({
        created_by_id: requestedByUserId,
        requestedByUserId,
        requestedAdminUserId: targetAdmin.id,
        requestedAdminEmail: targetAdmin.email,
        message: this.normalizeOptionalText(dto.message),
        status: OrganizationAccessRequestStatusEnum.pending,
      });

      const saved = await requestRepository.save(request);

      await notificationRepository.save(
        notificationRepository.create({
          ...adminNotificationPayload,
          metadata: {
            ...adminNotificationPayload.metadata,
            requestId: saved.id,
          },
        }),
      );

      return saved;
    });

    await Promise.allSettled(
      [
        this.emailService.sendOrganizationAccessRequestEmail(targetAdmin.email, {
          adminName: targetAdmin.name,
          requesterName: requester.name,
          reviewLink,
        }),
      ],
    );

    await this.notificationsService.sendPushToUser(targetAdmin.id, {
      ...adminNotificationPayload,
      metadata: {
        ...adminNotificationPayload.metadata,
        requestId: savedRequest.id,
      },
    });

    return this.findOne(savedRequest.id);
  }

  async findPendingForAdmin(adminUserId: string) {
    return this.accessRequestRepository
      .createQueryBuilder('organization_access_request')
      .leftJoinAndSelect('organization_access_request.requestedByUser', 'requested_by_user')
      .leftJoinAndSelect('organization_access_request.requestedAdminUser', 'requested_admin_user')
      .leftJoinAndSelect('organization_access_request.reviewedByUser', 'reviewed_by_user')
      .leftJoinAndSelect('organization_access_request.created_by_user', 'created_by_user')
      .where('organization_access_request.status = :status', {
        status: OrganizationAccessRequestStatusEnum.pending,
      })
      .andWhere('organization_access_request.requested_admin_user_id = :adminUserId', {
        adminUserId,
      })
      .orderBy('organization_access_request.created_at', 'DESC')
      .getMany();
  }

  async approve(
    requestId: string,
    adminUserId: string,
    dto: ApproveOrganizationAccessRequestDto,
  ) {
    const reviewLink = this.getAdminReviewLink();
    const approvalResult = await this.dataSource.transaction(async (manager) => {
      const requestRepository = manager.getRepository(OrganizationAccessRequest);
      const notificationRepository = manager.getRepository(Notification);
      const mappingRepository = manager.getRepository(UserToOranizationMap);
      const organizationRepository = manager.getRepository(Organization);

      const request = await requestRepository.findOne({
        where: { id: requestId },
        relations: {
          requestedByUser: true,
          requestedAdminUser: true,
        },
      });

      if (!request) {
        throw new NotFoundException('Organization access request not found');
      }

      if (request.status !== OrganizationAccessRequestStatusEnum.pending) {
        throw new BadRequestException('This request has already been processed');
      }

      await this.ensureTargetAdmin(adminUserId, request.requestedAdminUserId);

      const adminOrganizationIds = await this.findAdminOrganizationIds(adminUserId, manager);
      const normalizedAssignments = this.normalizeAssignments(dto.assignments);
      const assignedOrganizationIds = [...new Set(normalizedAssignments.map((assignment) => assignment.organizationId))];

      if (!normalizedAssignments.length) {
        throw new BadRequestException('At least one organization must be selected for approval');
      }

      for (const assignment of normalizedAssignments) {
        if (!adminOrganizationIds.includes(assignment.organizationId)) {
          throw new ForbiddenException(
            'You can only assign the user to organizations where you are an admin',
          );
        }

        const organization = await organizationRepository.findOne({
          where: { id: assignment.organizationId },
        });

        if (!organization) {
          throw new BadRequestException('Organization not found');
        }
      }

      const approvedOrganizations = await organizationRepository.find({
        where: { id: In(assignedOrganizationIds) },
      });

      const organizationById = new Map(
        approvedOrganizations.map((organization) => [organization.id, organization]),
      );

      const currentDefaultMapping = await mappingRepository.findOne({
        where: {
          userId: request.requestedByUserId,
          isDefault: true,
        },
      });

      const existingMappingsCount = await mappingRepository.count({
        where: {
          userId: request.requestedByUserId,
        },
      });

      for (const [index, assignment] of normalizedAssignments.entries()) {
        const existingMapping = await mappingRepository.findOne({
          where: {
            userId: request.requestedByUserId,
            organizationId: assignment.organizationId,
          },
        });

        const shouldBeDefault =
          !currentDefaultMapping && existingMappingsCount === 0 && index === 0;

        if (existingMapping) {
          existingMapping.role = assignment.role;
          if (shouldBeDefault) {
            await mappingRepository.update(
              { userId: request.requestedByUserId },
              { isDefault: false },
            );
            existingMapping.isDefault = true;
          }

          existingMapping.updated_by_id = adminUserId;
          await mappingRepository.save(existingMapping);
          continue;
        }

        if (shouldBeDefault) {
          await mappingRepository.update(
            { userId: request.requestedByUserId },
            { isDefault: false },
          );
        }

        await mappingRepository.save(
          mappingRepository.create({
            created_by_id: adminUserId,
            userId: request.requestedByUserId,
            organizationId: assignment.organizationId,
            role: assignment.role,
            isDefault: shouldBeDefault,
          }),
        );
      }

      request.status = OrganizationAccessRequestStatusEnum.approved;
      request.reviewedByUserId = adminUserId;
      request.reviewedAt = new Date();
      request.reviewNote = this.normalizeOptionalText(dto.reviewNote);
      request.updated_by_id = adminUserId;

      const savedRequest = await requestRepository.save(request);

      const requesterOrganizationDetails = normalizedAssignments.map((assignment) => {
        const organization = organizationById.get(assignment.organizationId);

        return {
          organizationId: assignment.organizationId,
          organizationName: organization?.name || assignment.organizationId,
          role: assignment.role,
        };
      });

      const organizationAdminRecipients = await this.findOrganizationAdminRecipients(
        assignedOrganizationIds,
        normalizedAssignments,
        manager,
      );

      await notificationRepository.save(
        notificationRepository.create({
          created_by_id: adminUserId,
          userId: request.requestedByUserId,
          title: 'Organization access request approved',
          body: this.formatRequesterApprovalBody(requesterOrganizationDetails),
          link: this.getAppLink(),
          type: NotificationTypeEnum.organization_access_request_decision,
          metadata: {
            requestId: savedRequest.id,
            status: savedRequest.status,
            targetAdminId: request.requestedAdminUserId,
            assignments: requesterOrganizationDetails,
          },
        }),
      );

      const adminNotifications = organizationAdminRecipients.flatMap((recipient) =>
        recipient.organizationDetails.map((detail) =>
          notificationRepository.create({
            created_by_id: adminUserId,
            userId: recipient.userId,
            title: 'New organization member approved',
            body: `${request.requestedByUser.name} has been added to ${detail.organizationName} as ${this.formatRoleLabel(detail.role)}.`,
            link: reviewLink,
            type: NotificationTypeEnum.organization_access_request_decision,
            metadata: {
              requestId: savedRequest.id,
              requesterId: request.requestedByUserId,
              requesterName: request.requestedByUser.name,
              organizationId: detail.organizationId,
              organizationName: detail.organizationName,
              role: detail.role,
            },
          }),
        ),
      );

      if (adminNotifications.length) {
        await notificationRepository.save(adminNotifications);
      }

      const updatedRequest = await requestRepository.findOne({
        where: { id: savedRequest.id },
        relations: {
          requestedByUser: true,
          requestedAdminUser: true,
          reviewedByUser: true,
        },
      });

      return {
        request: updatedRequest,
        requester: request.requestedByUser,
        requesterOrganizationDetails,
        organizationAdminRecipients,
      };
    });

    const { requester, requesterOrganizationDetails, organizationAdminRecipients } = approvalResult;

    await Promise.allSettled([
      this.emailService.sendOrganizationAccessApprovedEmail(requester.email, {
        requesterName: requester.name,
        organizationDetails: requesterOrganizationDetails.map((detail) => ({
          name: detail.organizationName,
          role: this.formatRoleLabel(detail.role),
        })),
        appLink: this.getAppLink(),
      }),
      ...organizationAdminRecipients.map((recipient) =>
        this.emailService.sendOrganizationNewMemberEmail(recipient.email, {
          adminName: recipient.name,
          requesterName: requester.name,
          organizationDetails: recipient.organizationDetails.map((detail) => ({
            name: detail.organizationName,
            role: this.formatRoleLabel(detail.role),
          })),
          reviewLink,
        }),
      ),
      this.notificationsService.sendPushToUser(requester.id, {
        title: 'Organization access request approved',
        body: this.formatRequesterApprovalBody(requesterOrganizationDetails),
        link: this.getAppLink(),
        type: NotificationTypeEnum.organization_access_request_decision,
        metadata: {
          requestId: approvalResult.request?.id,
          status: OrganizationAccessRequestStatusEnum.approved,
          assignments: requesterOrganizationDetails,
        },
      }),
      ...organizationAdminRecipients.flatMap((recipient) =>
        recipient.organizationDetails.map((detail) =>
          this.notificationsService.sendPushToUser(recipient.userId, {
            title: 'New organization member approved',
            body: `${requester.name} has been added to ${detail.organizationName} as ${this.formatRoleLabel(detail.role)}.`,
            link: reviewLink,
            type: NotificationTypeEnum.organization_access_request_decision,
            metadata: {
              requestId: approvalResult.request?.id,
              requesterId: requester.id,
              requesterName: requester.name,
              organizationId: detail.organizationId,
              organizationName: detail.organizationName,
              role: detail.role,
            },
          }),
        ),
      ),
    ]);

    return approvalResult.request;
  }

  async reject(requestId: string, adminUserId: string, dto: RejectOrganizationAccessRequestDto) {
    const request = await this.accessRequestRepository.findOne({
      where: { id: requestId },
      relations: {
        requestedByUser: true,
        requestedAdminUser: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Organization access request not found');
    }

    if (request.status !== OrganizationAccessRequestStatusEnum.pending) {
      throw new BadRequestException('This request has already been processed');
    }

    await this.ensureTargetAdmin(adminUserId, request.requestedAdminUserId);

    request.status = OrganizationAccessRequestStatusEnum.rejected;
    request.reviewedByUserId = adminUserId;
    request.reviewedAt = new Date();
    request.reviewNote = this.normalizeOptionalText(dto.reviewNote);
    request.updated_by_id = adminUserId;

    const savedRequest = await this.accessRequestRepository.save(request);

    await this.notificationRepository.save(
      this.notificationRepository.create({
        created_by_id: adminUserId,
        userId: request.requestedByUserId,
        title: 'Organization access request rejected',
        body: 'Your access request was rejected.',
        link: this.getAdminReviewLink(),
        type: NotificationTypeEnum.organization_access_request_decision,
        metadata: {
          requestId: savedRequest.id,
          status: savedRequest.status,
          targetAdminId: request.requestedAdminUserId,
        },
      }),
    );

    await this.notificationsService.sendPushToUser(request.requestedByUserId, {
      title: 'Organization access request rejected',
      body: 'Your access request was rejected.',
      link: this.getAdminReviewLink(),
      type: NotificationTypeEnum.organization_access_request_decision,
      metadata: {
        requestId: savedRequest.id,
        status: savedRequest.status,
        targetAdminId: request.requestedAdminUserId,
      },
    });

    return this.findOne(savedRequest.id);
  }

  async findOne(id: string) {
    return this.accessRequestRepository.findOne({
      where: { id },
      relations: {
        requestedByUser: true,
        requestedAdminUser: true,
        reviewedByUser: true,
        created_by_user: true,
        updated_by_user: true,
      },
    });
  }

  private async findUserOrFail(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(
        'We could not find an account for this session. Please sign in again and try once more.',
      );
    }

    return user;
  }

  private async findUserByEmailOrFail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: normalizedEmail })
      .getOne();

    if (!user) {
      throw new NotFoundException(
        'We could not find an account for the provided admin email. Please verify the address or contact your system administrator.',
      );
    }

    return user;
  }

  private async ensureTargetAdmin(adminUserId: string, targetAdminUserId: string) {
    if (adminUserId !== targetAdminUserId) {
      throw new ForbiddenException('You are not allowed to review this request');
    }
  }

  private async findAdminOrganizationIds(
    adminUserId: string,
    manager?: EntityManager,
  ): Promise<string[]> {
    const mappingRepository = (manager ?? this.dataSource.manager).getRepository(UserToOranizationMap);

    const mappings = await mappingRepository.find({
      where: {
        userId: adminUserId,
        role: RolesEnum.admin,
      },
    });

    return mappings.map((mapping) => mapping.organizationId);
  }

  private async findOrganizationAdminRecipients(
    organizationIds: string[],
    assignments: ApproveOrganizationAccessRequestDto['assignments'],
    manager?: EntityManager,
  ): Promise<OrganizationAdminRecipient[]> {
    if (!organizationIds.length) {
      return [];
    }

    const mappingRepository = (manager ?? this.dataSource.manager).getRepository(UserToOranizationMap);

    const mappings = await mappingRepository
      .createQueryBuilder('mapping')
      .leftJoinAndSelect('mapping.user', 'user')
      .leftJoinAndSelect('mapping.organization', 'organization')
      .where('mapping.organization_id IN (:...organizationIds)', { organizationIds })
      .andWhere('mapping.role = :role', { role: RolesEnum.admin })
      .andWhere('mapping.deleted_at IS NULL')
      .getMany();

    const recipientsByUserId = new Map<string, OrganizationAdminRecipient>();
    const assignmentByOrganizationId = new Map(
      assignments.map((assignment) => [assignment.organizationId, assignment]),
    );

    for (const mapping of mappings) {
      const user = mapping.user;
      const organization = mapping.organization;

      if (!user || !organization) {
        continue;
      }

      const existingRecipient = recipientsByUserId.get(user.id);

      const detail: OrganizationApprovalDetail = {
        organizationId: organization.id,
        organizationName: organization.name,
        role: assignmentByOrganizationId.get(organization.id)?.role || RolesEnum.user,
      };

      if (existingRecipient) {
        existingRecipient.organizationDetails.push(detail);
        continue;
      }

      recipientsByUserId.set(user.id, {
        userId: user.id,
        email: user.email,
        name: user.name,
        organizationDetails: [detail],
      });
    }

    return [...recipientsByUserId.values()];
  }

  private formatRoleLabel(role: RolesEnum) {
    return role === RolesEnum.admin ? 'Admin' : 'User';
  }

  private formatRequesterApprovalBody(details: OrganizationApprovalDetail[]) {
    if (!details.length) {
      return 'Your access request has been approved.';
    }

    const summary = details
      .map((detail) => `${detail.organizationName} as ${this.formatRoleLabel(detail.role)}`)
      .join(', ');

    return `Your access request has been approved. You now have access to ${summary}.`;
  }

  private getAppLink() {
    return (
      this.configService.get<string>('PUBLIC_APP_URL') ||
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('FRONTEND_PUBLIC_URL') ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  private normalizeAssignments(
    assignments: ApproveOrganizationAccessRequestDto['assignments'],
  ) {
    const uniqueAssignments = new Map<string, ApproveOrganizationAccessRequestDto['assignments'][number]>();

    for (const assignment of assignments) {
      uniqueAssignments.set(assignment.organizationId, assignment);
    }

    return [...uniqueAssignments.values()];
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private getAdminReviewLink() {
    const appUrl = (
      this.configService.get<string>('PUBLIC_APP_URL') ||
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('FRONTEND_PUBLIC_URL') ||
      'http://localhost:3000'
    ).replace(/\/$/, '');

    return `${appUrl}/iam/access/organization-requests`;
  }
}
