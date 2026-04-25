import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Organization } from '../organization/entity/organization.entity';
import { CreateUserToOranizationMapDto } from './dto/create-user-to-oranization-map.dto';
import { UserToOranizationMap } from './entity/user-to-oranization-map.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class UserToOranizationMapService {
  constructor(
    @InjectRepository(UserToOranizationMap)
    private userToOranizationMapRepository: Repository<UserToOranizationMap>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async create(dto: CreateUserToOranizationMapDto) {
    await this.findUserOrFail(dto.userId);
    await this.findOrganizationOrFail(dto.organizationId);
    await this.ensureMappingDoesNotExist(dto.userId, dto.organizationId);

    const mapping = this.userToOranizationMapRepository.create({
      userId: dto.userId,
      organizationId: dto.organizationId,
    });

    await this.userToOranizationMapRepository.save(mapping);
    return this.findOne(dto.userId, dto.organizationId);
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
    await this.findOrganizationOrFail(organizationId);

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

  async findOrganizationsByUser(userId: string) {
    await this.findUserOrFail(userId);

    const mappings = await this.userToOranizationMapRepository
      .createQueryBuilder('user_to_oranization_map')
      .innerJoinAndSelect('user_to_oranization_map.organization', 'organization')
      .leftJoinAndSelect('organization.created_by_user', 'created_by_user')
      .leftJoinAndSelect('organization.updated_by_user', 'updated_by_user')
      .where('user_to_oranization_map.user_id = :userId', { userId })
      .andWhere('user_to_oranization_map.deleted_at IS NULL')
      .orderBy('organization.created_at', 'DESC')
      .getMany();

    return mappings.map((mapping) => mapping.organization);
  }

  async remove(userId: string, organizationId: string) {
    return this.userToOranizationMapRepository.delete({
      userId,
      organizationId,
    });
  }

  private async ensureMappingDoesNotExist(userId: string, organizationId: string) {
    const existing = await this.userToOranizationMapRepository.findOne({
      where: {
        userId,
        organizationId,
      },
    });

    if (existing) {
      throw new BadRequestException('User is already mapped to this organization');
    }
  }

  private async findUserOrFail(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  private async findOrganizationOrFail(organizationId: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }

    return organization;
  }
}
