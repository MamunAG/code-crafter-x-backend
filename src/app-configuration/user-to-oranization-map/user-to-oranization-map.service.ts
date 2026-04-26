import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { RolesEnum } from 'src/common/enums/role.enum';
import { Organization } from '../organization/entity/organization.entity';
import { CreateUserToOranizationMapDto } from './dto/create-user-to-oranization-map.dto';
import { UpdateUserToOranizationMapDefaultDto } from './dto/update-user-to-oranization-map-default.dto';
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

  async remove(userId: string, organizationId: string) {
    return this.userToOranizationMapRepository.delete({
      userId,
      organizationId,
    });
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
