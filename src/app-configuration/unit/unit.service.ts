import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Unit } from './entity/unit.entity';
import { CreateUnitDto } from './dto/create-unit.dto';
import { FilterUnitDto } from './dto/filter-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitService {
  constructor(
    @InjectRepository(Unit)
    private uomRepository: Repository<Unit>,
  ) { }

  async create(uomDto: CreateUnitDto, organizationId: string) {
    await this.ensureNameIsUnique(uomDto.name, organizationId);
    const uom = this.uomRepository.create({
      ...uomDto,
      organizationId,
    });
    const saved = await this.uomRepository.save(uom);
    return this.findOne(saved.id, organizationId);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterUnitDto>,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Unit>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.uomRepository
      .createQueryBuilder('uom')
      .leftJoinAndSelect('uom.created_by_user', 'created_by_user')
      .leftJoinAndSelect('uom.updated_by_user', 'updated_by_user')
      .where('uom.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy('uom.created_at', 'DESC');

    if (filters?.name) {
      queryBuilder.andWhere('uom.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.shortName) {
      queryBuilder.andWhere('uom.shortName ILIKE :shortName', {
        shortName: `%${filters.shortName}%`,
      });
    }

    if (filters?.isActive) {
      queryBuilder.andWhere('uom.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  findOne(id: number, organizationId: string) {
    return this.uomRepository
      .createQueryBuilder('uom')
      .leftJoinAndSelect('uom.created_by_user', 'created_by_user')
      .leftJoinAndSelect('uom.updated_by_user', 'updated_by_user')
      .where('uom.organization_id = :organizationId', { organizationId })
      .andWhere('uom.id = :id', { id })
      .andWhere('uom.deleted_at IS NULL')
      .getOne()
      .then((uom) => {
        if (!uom) {
          throw new NotFoundException('UOM not found in the selected organization.');
        }

        return uom;
      });
  }

  async update(id: number, dto: UpdateUnitDto, organizationId: string) {
    await this.ensureUnitExists(id, organizationId);
    await this.ensureNameIsUnique(dto.name, organizationId, id);
    await this.uomRepository.update({ id, organizationId }, dto);
    return this.findOne(id, organizationId);
  }

  async remove(id: number, organizationId: string) {
    await this.ensureUnitExists(id, organizationId);
    return this.uomRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: number, organizationId: string) {
    await this.ensureUnitExists(id, organizationId, true);
    return this.uomRepository.delete({ id, organizationId });
  }

  async restore(id: number, organizationId: string) {
    await this.ensureUnitExists(id, organizationId, true);
    return this.uomRepository.restore({ id, organizationId });
  }

  private async ensureNameIsUnique(name: string, organizationId: string, ignoreId?: number) {
    const normalizedName = name.trim().toLowerCase();

    const queryBuilder = this.uomRepository
      .createQueryBuilder('uom')
      .where('LOWER(TRIM(uom.name)) = :name', { name: normalizedName })
      .andWhere('uom.organization_id = :organizationId', { organizationId })
      .andWhere('uom.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('uom.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('UOM already exists');
    }
  }

  private async ensureUnitExists(id: number, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.uomRepository
      .createQueryBuilder('uom')
      .where('uom.id = :id', { id })
      .andWhere('uom.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('uom.deleted_at IS NULL');
    }

    const uom = await queryBuilder.getOne();

    if (!uom) {
      throw new NotFoundException('UOM not found in the selected organization.');
    }

    return uom;
  }
}
