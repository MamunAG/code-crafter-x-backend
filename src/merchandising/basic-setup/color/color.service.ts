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
    await this.ensureColorNameIsUnique(colorDto.color_name);
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

    if (filters?.color_name) {
      queryBuilder.andWhere('color.color_name ILIKE :color_name', {
        color_name: `%${filters.color_name}%`,
      });
    }
    if (filters?.color_display_name) {
      queryBuilder.andWhere('color.color_display_name ILIKE :color_display_name', {
        color_display_name: `%${filters.color_display_name}%`,
      });
    }
    if (filters?.color_description) {
      queryBuilder.andWhere('color.color_description ILIKE :color_description', {
        color_description: `%${filters.color_description}%`,
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
    await this.ensureColorNameIsUnique(dto.color_name, id);
    await this.colorRepository.update(id, dto);
    return this.findOne(id);
  }

  private async ensureColorNameIsUnique(colorName: string, ignoreId?: number) {
    const normalizedColorName = colorName.trim().toLowerCase();

    const queryBuilder = this.colorRepository
      .createQueryBuilder('color')
      .where('LOWER(TRIM(color.color_name)) = :colorName', {
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
