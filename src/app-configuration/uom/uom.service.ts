import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Uom } from './entity/uom.entity';
import { CreateUomDto } from './dto/create-uom.dto';
import { FilterUomDto } from './dto/filter-uom.dto';
import { UpdateUomDto } from './dto/update-uom.dto';

@Injectable()
export class UomService {
  constructor(
    @InjectRepository(Uom)
    private uomRepository: Repository<Uom>,
  ) { }

  async create(uomDto: CreateUomDto) {
    await this.ensureNameIsUnique(uomDto.name);
    const uom = this.uomRepository.create(uomDto);
    const saved = await this.uomRepository.save(uom);
    return this.findOne(saved.id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterUomDto>,
  ): Promise<PaginatedResponseDto<Uom>> {
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

    if (filters?.short_name) {
      queryBuilder.andWhere('uom.short_name ILIKE :short_name', {
        short_name: `%${filters.short_name}%`,
      });
    }

    if (filters?.is_active) {
      queryBuilder.andWhere('uom.is_active = :is_active', {
        is_active: filters.is_active,
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

  async update(id: number, dto: UpdateUomDto) {
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
