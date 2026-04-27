import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { NotificationTypeEnum } from 'src/common/enums/notification-type.enum';
import { RolesEnum } from 'src/common/enums/role.enum';
import { Notification } from 'src/notifications/entity/notification.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Organization } from '../organization/entity/organization.entity';
import { CreateUserToOranizationMapDto } from './dto/create-user-to-oranization-map.dto';
import { UpdateUserToOranizationMapDefaultDto } from './dto/update-user-to-oranization-map-default.dto';
import { UpdateUserToOranizationMapRoleDto } from './dto/update-user-to-oranization-map-role.dto';
import { UserToOranizationMap } from './entity/user-to-oranization-map.entity';
import { User } from 'src/users/entities/user.entity';

type OrganizationWithDefault = Organization & {
  isDefault: boolean;
};

@Injectable()
export class UserToOranizationMapService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,

    @InjectRepository(UserToOranizationMap)
    private userToOranizationMapRepository: Repository<UserToOranizationMap>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateUserToOranizationMapDto) {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const organizationRepository = manager.getRepository(Organization);
      const mappingRepository = manager.getRepository(UserToOranizationMap);

      await this.findUserOrFail(userRepository, dto.userId);
      await this.findOrganizationOrFail(organizationRepository, dto.organizationId);
      await this.ensureMappingDoesNotExist(mappingRepository, dto.userId, dto.organizationId);

      const existingMappingsCount = await mappingRepository.count({
        where: {
          userId: dto.userId,
        },
      });
      const shouldBeDefault = dto.isDefault ?? existingMappingsCount === 0;

      if (shouldBeDefault) {
        await mappingRepository.update(
          {
            userId: dto.userId,
          },
          {
            isDefault: false,
          },
        );
      }

      const mapping = mappingRepository.create({
        userId: dto.userId,
        organizationId: dto.organizationId,
        role: dto.role ?? RolesEnum.user,
        isDefault: shouldBeDefault,
      });

      await mappingRepository.save(mapping);
      return this.findOne(dto.userId, dto.organizationId);
    });
  }

  findOne(userId: string, organizationId: string) {
    return this.userToOranizationMapRepository
      .createQueryBuilder('user_to_oranization_map')
      .leftJoinAndSelect('user_to_oranization_map.user', 'user')
      .leftJoinAndSelect('user_to_oranization_map.organization', 'organization')
      .leftJoinAndSelect('user_to_oranization_map.created_by_user', 'created_by_user')
      .leftJoinAndSelect('user_to_oranization_map.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('user_to_oranization_map.deleted_by_user', 'deleted_by_user')
      .where('user_to_oranization_map.user_id = :userId', { userId })
      .andWhere('user_to_oranization_map.organization_id = :organizationId', { organizationId })
      .getOne();
  }

  async findUsersByOrganization(organizationId: string) {
    await this.findOrganizationOrFail(this.organizationRepository, organizationId);

    const mappings = await this.userToOranizationMapRepository
      .createQueryBuilder('user_to_oranization_map')
      .innerJoinAndSelect('user_to_oranization_map.user', 'user')
      .leftJoinAndSelect('user.created_by_user', 'created_by_user')
      .leftJoinAndSelect('user.updated_by_user', 'updated_by_user')
      .where('user_to_oranization_map.organization_id = :organizationId', { organizationId })
      .andWhere('user_to_oranization_map.deleted_at IS NULL')
      .orderBy('user.created_at', 'DESC')
      .getMany();

    return mappings.map((mapping) => mapping.user);
  }

  async findMappingsByOrganizationForAdmin(organizationId: string, adminUserId: string) {
    await this.findOrganizationOrFail(this.organizationRepository, organizationId);
    await this.ensureUserIsOrganizationAdmin(
      this.userToOranizationMapRepository,
      adminUserId,
      organizationId,
    );

    return this.userToOranizationMapRepository
      .createQueryBuilder('user_to_oranization_map')
      .innerJoinAndSelect('user_to_oranization_map.user', 'user')
      .innerJoinAndSelect('user_to_oranization_map.organization', 'organization')
      .leftJoinAndSelect('user.profile_pic', 'profile_pic')
      .where('user_to_oranization_map.organization_id = :organizationId', { organizationId })
      .andWhere('user_to_oranization_map.deleted_at IS NULL')
      .orderBy('user_to_oranization_map.role', 'ASC')
      .addOrderBy('user.name', 'ASC')
      .getMany();
  }

  async findManageableMappingsForAdmin(adminUserId: string) {
    const adminOrganizationMappings = await this.userToOranizationMapRepository.find({
      where: {
        userId: adminUserId,
        role: RolesEnum.admin,
      },
      select: {
        organizationId: true,
      },
    });
    const organizationIds = adminOrganizationMappings.map((mapping) => mapping.organizationId);

    if (!organizationIds.length) {
      return [];
    }

    return this.userToOranizationMapRepository
      .createQueryBuilder('user_to_oranization_map')
      .innerJoinAndSelect('user_to_oranization_map.user', 'user')
      .innerJoinAndSelect('user_to_oranization_map.organization', 'organization')
      .leftJoinAndSelect('user.profile_pic', 'profile_pic')
      .where('user_to_oranization_map.organization_id IN (:...organizationIds)', { organizationIds })
      .andWhere('user_to_oranization_map.deleted_at IS NULL')
      .orderBy('user.name', 'ASC')
      .addOrderBy('organization.name', 'ASC')
      .getMany();
  }

  async findOrganizationsByUser(userId: string): Promise<OrganizationWithDefault[]> {
    await this.findUserOrFail(this.userRepository, userId);

    const mappings = await this.userToOranizationMapRepository
      .createQueryBuilder('user_to_oranization_map')
      .innerJoinAndSelect('user_to_oranization_map.organization', 'organization')
      .leftJoinAndSelect('organization.created_by_user', 'created_by_user')
      .leftJoinAndSelect('organization.updated_by_user', 'updated_by_user')
      .where('user_to_oranization_map.user_id = :userId', { userId })
      .andWhere('user_to_oranization_map.deleted_at IS NULL')
      .orderBy('user_to_oranization_map.is_default', 'DESC')
      .addOrderBy('organization.created_at', 'DESC')
      .getMany();

    return mappings.map((mapping) => ({
      ...mapping.organization,
      isDefault: mapping.isDefault,
    }));
  }

  async findMappingsByUser(userId: string) {
    await this.findUserOrFail(this.userRepository, userId);

    return this.userToOranizationMapRepository
      .createQueryBuilder('user_to_oranization_map')
      .innerJoinAndSelect('user_to_oranization_map.organization', 'organization')
      .leftJoinAndSelect('organization.created_by_user', 'created_by_user')
      .leftJoinAndSelect('organization.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('user_to_oranization_map.user', 'user')
      .where('user_to_oranization_map.user_id = :userId', { userId })
      .andWhere('user_to_oranization_map.deleted_at IS NULL')
      .orderBy('user_to_oranization_map.is_default', 'DESC')
      .addOrderBy('organization.created_at', 'DESC')
      .getMany();
  }

  async updateDefault(
    userId: string,
    organizationId: string,
    dto: UpdateUserToOranizationMapDefaultDto,
  ) {
    await this.findUserOrFail(this.userRepository, userId);
    await this.findOrganizationOrFail(this.organizationRepository, organizationId);

    const mapping = await this.userToOranizationMapRepository.findOne({
      where: {
        userId,
        organizationId,
      },
    });

    if (!mapping) {
      throw new BadRequestException('Mapping not found');
    }

    if (dto.isDefault) {
      await this.userToOranizationMapRepository.update(
        {
          userId,
        },
        {
          isDefault: false,
        },
      );
    }

    await this.userToOranizationMapRepository.update(
      {
        userId,
        organizationId,
      },
      {
        isDefault: dto.isDefault,
      },
    );

    return this.findOne(userId, organizationId);
  }

  async updateRole(
    userId: string,
    organizationId: string,
    dto: UpdateUserToOranizationMapRoleDto,
    updatedByUserId: string,
  ) {
    if (userId === updatedByUserId) {
      throw new BadRequestException('You cannot change your own organization role.');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const mappingRepository = manager.getRepository(UserToOranizationMap);
      const notificationRepository = manager.getRepository(Notification);

      const mapping = await mappingRepository.findOne({
        where: {
          userId,
          organizationId,
        },
        relations: {
          organization: true,
        },
      });

      if (!mapping) {
        throw new BadRequestException('This user does not currently have access to the organization.');
      }

      await this.ensureUserIsOrganizationAdmin(mappingRepository, updatedByUserId, organizationId);

      if (mapping.role === dto.role) {
        return {
          mapping,
          organizationName: mapping.organization.name,
        };
      }

      if (mapping.role === RolesEnum.admin && dto.role !== RolesEnum.admin) {
        const adminCount = await mappingRepository.count({
          where: {
            organizationId,
            role: RolesEnum.admin,
          },
        });

        if (adminCount <= 1) {
          throw new BadRequestException('This organization must keep at least one admin.');
        }
      }

      await mappingRepository.update(
        {
          userId,
          organizationId,
        },
        {
          role: dto.role,
          updated_by_id: updatedByUserId,
        },
      );

      await notificationRepository.save(
        notificationRepository.create({
          userId,
          title: 'Organization role updated',
          body: `Your role in ${mapping.organization.name} has been changed to ${dto.role}.`,
          type: NotificationTypeEnum.organization_access_request_decision,
          metadata: {
            organizationId,
            organizationName: mapping.organization.name,
            role: dto.role,
            updatedByUserId,
          },
          created_by_id: updatedByUserId,
        }),
      );

      return {
        mapping: await this.findOne(userId, organizationId),
        organizationName: mapping.organization.name,
      };
    });

    await this.notificationsService.sendPushToUser(userId, {
      title: 'Organization role updated',
      body: `Your role in ${result.organizationName} has been changed to ${dto.role}.`,
      type: NotificationTypeEnum.organization_access_request_decision,
      metadata: {
        organizationId,
        organizationName: result.organizationName,
        role: dto.role,
        updatedByUserId,
      },
    });

    return result.mapping;
  }

  async remove(userId: string, organizationId: string, revokedByUserId: string) {
    if (userId === revokedByUserId) {
      throw new BadRequestException('You cannot revoke your own organization access.');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const mappingRepository = manager.getRepository(UserToOranizationMap);
      const notificationRepository = manager.getRepository(Notification);

      const mapping = await mappingRepository.findOne({
        where: {
          userId,
          organizationId,
        },
        relations: {
          user: true,
          organization: true,
        },
      });

      if (!mapping) {
        throw new BadRequestException('This user does not currently have access to the organization.');
      }

      await this.ensureUserIsOrganizationAdmin(mappingRepository, revokedByUserId, organizationId);

      if (mapping.role === RolesEnum.admin) {
        const adminCount = await mappingRepository.count({
          where: {
            organizationId,
            role: RolesEnum.admin,
          },
        });

        if (adminCount <= 1) {
          throw new BadRequestException('This organization must keep at least one admin.');
        }
      }

      await mappingRepository.delete({
        userId,
        organizationId,
      });

      if (mapping.isDefault) {
        const nextDefaultMapping = await mappingRepository.findOne({
          where: {
            userId,
          },
          order: {
            created_at: 'ASC',
          },
        });

        if (nextDefaultMapping) {
          await mappingRepository.update(
            {
              userId,
              organizationId: nextDefaultMapping.organizationId,
            },
            {
              isDefault: true,
            },
          );
        }
      }

      await notificationRepository.save(
        notificationRepository.create({
          userId,
          title: 'Organization access removed',
          body: `Your access to ${mapping.organization.name} has been removed by an organization admin.`,
          type: NotificationTypeEnum.organization_access_request_decision,
          metadata: {
            organizationId,
            organizationName: mapping.organization.name,
            revokedByUserId,
          },
          created_by_id: revokedByUserId,
        }),
      );

      return {
        userId,
        organizationId,
        organizationName: mapping.organization.name,
        revoked: true,
      };
    });

    await this.notificationsService.sendPushToUser(userId, {
      title: 'Organization access removed',
      body: `Your access to ${result.organizationName} has been removed by an organization admin.`,
      type: NotificationTypeEnum.organization_access_request_decision,
      metadata: {
        organizationId,
        organizationName: result.organizationName,
        revokedByUserId,
      },
    });

    return result;
  }

  private async ensureUserIsOrganizationAdmin(
    mappingRepository: Repository<UserToOranizationMap>,
    userId: string,
    organizationId: string,
  ) {
    const adminMapping = await mappingRepository.findOne({
      where: {
        userId,
        organizationId,
        role: RolesEnum.admin,
      },
    });

    if (!adminMapping) {
      throw new ForbiddenException('Only an organization admin can manage access for this organization.');
    }

    return adminMapping;
  }

  private async ensureMappingDoesNotExist(
    mappingRepository: Repository<UserToOranizationMap>,
    userId: string,
    organizationId: string,
  ) {
    const existing = await mappingRepository.findOne({
      where: {
        userId,
        organizationId,
      },
    });

    if (existing) {
      throw new BadRequestException('User is already mapped to this organization');
    }
  }

  private async findUserOrFail(userRepository: Repository<User>, userId: string) {
    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  private async findOrganizationOrFail(
    organizationRepository: Repository<Organization>,
    organizationId: string,
  ) {
    const organization = await organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    return organization;
  }
}
