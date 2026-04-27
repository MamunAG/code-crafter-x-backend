import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateMenuDto } from './dto/create-menu.dto';
import { FilterMenuDto } from './dto/filter-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { Menu } from './entity/menu.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async create(dto: CreateMenuDto) {
    await this.ensureMenuPathIsUnique(dto.menuPath);

    const menu = this.menuRepository.create({
      ...dto,
      menuName: dto.menuName.trim(),
      menuPath: this.normalizePath(dto.menuPath),
      description: this.normalizeOptionalText(dto.description),
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.menuRepository.save(menu);
    return this.findOne(saved.id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterMenuDto>,
  ): Promise<PaginatedResponseDto<Menu>> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .where('menu.deleted_at IS NULL')
      .skip(skip)
      .take(limit)
      .orderBy('menu.displayOrder', 'ASC')
      .addOrderBy('menu.created_at', 'DESC');

    if (filters?.menuName) {
      queryBuilder.andWhere('menu.menuName ILIKE :menuName', {
        menuName: `%${filters.menuName.trim()}%`,
      });
    }

    if (filters?.menuPath) {
      queryBuilder.andWhere('menu.menuPath ILIKE :menuPath', {
        menuPath: `%${filters.menuPath.trim()}%`,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('menu.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const menu = await this.menuRepository
      .createQueryBuilder('menu')
      .where('menu.id = :id', { id })
      .andWhere('menu.deleted_at IS NULL')
      .getOne();

    if (!menu) {
      throw new NotFoundException('Menu entry not found');
    }

    return menu;
  }

  async update(id: string, dto: UpdateMenuDto) {
    const existing = await this.findOne(id);
    const nextMenuPath = dto.menuPath ? this.normalizePath(dto.menuPath) : existing.menuPath;

    await this.ensureMenuPathIsUnique(nextMenuPath, id);

    await this.menuRepository.update(id, {
      menuName: dto.menuName?.trim() ?? existing.menuName,
      menuPath: nextMenuPath,
      description:
        dto.description === undefined ? existing.description : this.normalizeOptionalText(dto.description),
      displayOrder: dto.displayOrder ?? existing.displayOrder,
      isActive: dto.isActive ?? existing.isActive,
      updated_by_id: dto.updated_by_id,
    });

    return this.findOne(id);
  }

  remove(id: string, deletedById: string) {
    return this.menuRepository.update(id, {
      deleted_at: new Date(),
      deleted_by_id: deletedById,
    });
  }

  private async ensureMenuPathIsUnique(menuPath: string, ignoreId?: string) {
    const normalizedPath = this.normalizePath(menuPath).toLowerCase();
    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .where('LOWER(TRIM(menu.menuPath)) = :menuPath', { menuPath: normalizedPath })
      .andWhere('menu.deleted_at IS NULL');

    if (ignoreId) {
      queryBuilder.andWhere('menu.id != :ignoreId', { ignoreId });
    }

    const existingMenu = await queryBuilder.getOne();

    if (existingMenu) {
      throw new BadRequestException('Menu path already exists');
    }
  }

  private normalizePath(value: string) {
    const normalized = value.trim();
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }
}
