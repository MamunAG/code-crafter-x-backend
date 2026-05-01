import { BadRequestException, Injectable } from '@nestjs/common';
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

  async create(uomDto: CreateUnitDto) {
    await this.ensureNameIsUnique(uomDto.name);
    const uom = this.uomRepository.create(uomDto);
    const saved = await this.uomRepository.save(uom);
    return this.findOne(saved.id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterUnitDto>,
  ): Promise<PaginatedResponseDto<Unit>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.uomRepository
      .createQueryBuilder('uom')
      .leftJoinAndSelect('uom.created_by_user', 'created_by_user')
      .leftJoinAndSelect('uom.updated_by_user', 'updated_by_user')
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

  findOne(id: number) {
    return this.uomRepository
      .createQueryBuilder('uom')
      .leftJoinAndSelect('uom.created_by_user', 'created_by_user')
      .leftJoinAndSelect('uom.updated_by_user', 'updated_by_user')
      .where('uom.id = :id', { id })
      .andWhere('uom.deleted_at IS NULL')
      .getOne();
  }

  async update(id: number, dto: UpdateUnitDto) {
    await this.ensureNameIsUnique(dto.name, id);
    await this.uomRepository.update(id, dto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.uomRepository.softDelete(id);
  }

  permanentRemove(id: number) {
    return this.uomRepository.delete(id);
  }

  restore(id: number) {
    return this.uomRepository.restore(id);
  }

  private async ensureNameIsUnique(name: string, ignoreId?: number) {
    const normalizedName = name.trim().toLowerCase();

    const queryBuilder = this.uomRepository
      .createQueryBuilder('uom')
      .where('LOWER(TRIM(uom.name)) = :name', { name: normalizedName })
      .andWhere('uom.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('uom.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('UOM already exists');
    }
  }
}
