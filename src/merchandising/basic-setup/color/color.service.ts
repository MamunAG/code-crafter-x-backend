import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Color } from './entity/color.entity';
import { CreateColorDto } from './dto/create-color.dto';
import { FilterColorDto } from './dto/filter-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@Injectable()
export class ColorService {
  constructor(
    @InjectRepository(Color)
    private colorRepository: Repository<Color>,
  ) { }

  async create(colorDto: CreateColorDto) {
    await this.ensureColorNameIsUnique(colorDto.colorName);
    const color = this.colorRepository.create(colorDto);
    const saved = await this.colorRepository.save(color);
    return this.findOne(saved.id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterColorDto>,
  ): Promise<PaginatedResponseDto<Color>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.colorRepository
      .createQueryBuilder('color')
      .leftJoinAndSelect('color.created_by_user', 'created_by_user')
      .leftJoinAndSelect('color.updated_by_user', 'updated_by_user')
      .skip(skip)
      .take(limit)
      .orderBy('color.created_at', 'DESC');

    if (filters?.colorName) {
      queryBuilder.andWhere('color.colorName ILIKE :colorName', {
        colorName: `%${filters.colorName}%`,
      });
    }
    if (filters?.colorDisplayName) {
      queryBuilder.andWhere('color.colorDisplayName ILIKE :colorDisplayName', {
        colorDisplayName: `%${filters.colorDisplayName}%`,
      });
    }
    if (filters?.colorDescription) {
      queryBuilder.andWhere('color.colorDescription ILIKE :colorDescription', {
        colorDescription: `%${filters.colorDescription}%`,
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
    return this.colorRepository
      .createQueryBuilder('color')
      .leftJoinAndSelect('color.created_by_user', 'created_by_user')
      .leftJoinAndSelect('color.updated_by_user', 'updated_by_user')
      .where('color.id = :id', { id })
      .andWhere('color.deleted_at IS NULL')
      .getOne();
  }

  async update(id: number, dto: UpdateColorDto) {
    await this.ensureColorNameIsUnique(dto.colorName, id);
    await this.colorRepository.update(id, dto);
    return this.findOne(id);
  }

  private async ensureColorNameIsUnique(colorName: string, ignoreId?: number) {
    const normalizedColorName = colorName.trim().toLowerCase();

    const queryBuilder = this.colorRepository
      .createQueryBuilder('color')
      .where('LOWER(TRIM(color.colorName)) = :colorName', {
        colorName: normalizedColorName,
      })
      .andWhere('color.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('color.id != :ignoreId', { ignoreId });
    }

    const existingColor = await queryBuilder.getOne();

    if (existingColor) {
      throw new BadRequestException('Color already exists');
    }
  }

  remove(id: number) {
    return this.colorRepository.softDelete(id);
  }

  permanentRemove(id: number) {
    return this.colorRepository.delete(id);
  }

  restore(id: number) {
    return this.colorRepository.restore(id);
  }
}
