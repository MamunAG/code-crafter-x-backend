import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Size } from './entity/size.entity';
import { CreateSizeDto } from './dto/create-size.dto';
import { FilterSizeDto } from './dto/filter-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

@Injectable()
export class SizeService {
  constructor(
    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,
  ) { }

  async create(sizeDto: CreateSizeDto) {
    await this.ensureSizeNameIsUnique(sizeDto.size_name);
    const size = this.sizeRepository.create(sizeDto);
    const saved = await this.sizeRepository.save(size);
    return this.findOne(saved.id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterSizeDto>,
  ): Promise<PaginatedResponseDto<Size>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.sizeRepository
      .createQueryBuilder('size')
      .leftJoinAndSelect('size.created_by_user', 'created_by_user')
      .leftJoinAndSelect('size.updated_by_user', 'updated_by_user')
      .skip(skip)
      .take(limit)
      .orderBy('size.created_at', 'DESC');

    if (filters?.size_name) {
      queryBuilder.andWhere('LOWER(TRIM(size.size_name)) LIKE :size_name', {
        size_name: `%${filters.size_name.trim().toLowerCase()}%`,
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
    return this.sizeRepository
      .createQueryBuilder('size')
      .leftJoinAndSelect('size.created_by_user', 'created_by_user')
      .leftJoinAndSelect('size.updated_by_user', 'updated_by_user')
      .where('size.id = :id', { id })
      .andWhere('size.deleted_at IS NULL')
      .getOne();
  }

  async update(id: number, dto: UpdateSizeDto) {
    await this.ensureSizeNameIsUnique(dto.size_name, id);
    await this.sizeRepository.update(id, dto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.sizeRepository.softDelete(id);
  }

  permanentRemove(id: number) {
    return this.sizeRepository.delete(id);
  }

  restore(id: number) {
    return this.sizeRepository.restore(id);
  }

  private async ensureSizeNameIsUnique(sizeName: string, ignoreId?: number) {
    const normalizedSizeName = sizeName.trim().toLowerCase();

    const queryBuilder = this.sizeRepository
      .createQueryBuilder('size')
      .where('LOWER(TRIM(size.size_name)) = :sizeName', {
        sizeName: normalizedSizeName,
      })
      .andWhere('size.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('size.id != :ignoreId', { ignoreId });
    }

    const existingSize = await queryBuilder.getOne();

    if (existingSize) {
      throw new BadRequestException('Size already exists');
    }
  }
}
