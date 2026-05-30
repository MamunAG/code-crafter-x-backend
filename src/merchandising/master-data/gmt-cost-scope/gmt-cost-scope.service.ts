import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateGmtCostScopeDto } from './dto/create-gmt-cost-scope.dto';
import { FilterGmtCostScopeDto } from './dto/filter-gmt-cost-scope.dto';
import { UpdateGmtCostScopeDto } from './dto/update-gmt-cost-scope.dto';
import { GmtCostScope } from './entity/gmt-cost-scope.entity';

@Injectable()
export class GmtCostScopeService {
  constructor(
    @InjectRepository(GmtCostScope)
    private readonly repository: Repository<GmtCostScope>,
  ) {}

  async create(dto: CreateGmtCostScopeDto, userId: string, organizationId: string) {
    await this.ensureNameIsUnique(dto.name, organizationId);
    const record = this.repository.create({
      name: dto.name.trim(),
      isActive: dto.isActive ?? true,
      organizationId,
      created_by_id: userId,
    });
    const saved = await this.repository.save(record);
    return this.findOne(saved.id, organizationId);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters: Partial<FilterGmtCostScopeDto> | undefined,
    organizationId: string,
  ): Promise<PaginatedResponseDto<GmtCostScope>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;
    const deletedOnly = filters?.deletedOnly ?? false;
    const queryBuilder = this.repository
      .createQueryBuilder('gmtCostScope')
      .leftJoinAndSelect('gmtCostScope.created_by_user', 'created_by_user')
      .leftJoinAndSelect('gmtCostScope.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('gmtCostScope.deleted_by_user', 'deleted_by_user')
      .where('gmtCostScope.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'gmtCostScope.deleted_at' : 'gmtCostScope.created_at', 'DESC');

    if (deletedOnly) queryBuilder.withDeleted().andWhere('gmtCostScope.deleted_at IS NOT NULL');
    else queryBuilder.andWhere('gmtCostScope.deleted_at IS NULL');

    if (filters?.name) {
      queryBuilder.andWhere('LOWER(TRIM(gmtCostScope.name)) LIKE :name', {
        name: `%${filters.name.trim().toLowerCase()}%`,
      });
    }
    if (filters?.isActive !== undefined && filters.isActive !== '') {
      queryBuilder.andWhere('gmtCostScope.is_active = :isActive', {
        isActive: filters.isActive === 'true',
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    return {
      items: this.normalizeUpdatedAtList(items),
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

  async findOne(id: number, organizationId: string) {
    const record = await this.repository
      .createQueryBuilder('gmtCostScope')
      .leftJoinAndSelect('gmtCostScope.created_by_user', 'created_by_user')
      .leftJoinAndSelect('gmtCostScope.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('gmtCostScope.deleted_by_user', 'deleted_by_user')
      .where('gmtCostScope.id = :id', { id })
      .andWhere('gmtCostScope.organization_id = :organizationId', { organizationId })
      .andWhere('gmtCostScope.deleted_at IS NULL')
      .getOne();
    if (!record) throw new NotFoundException('GMT cost scope not found in the selected organization.');
    return this.normalizeUpdatedAt(record);
  }

  async update(id: number, dto: UpdateGmtCostScopeDto, userId: string, organizationId: string) {
    await this.ensureExists(id, organizationId);
    await this.ensureNameIsUnique(dto.name, organizationId, id);
    await this.repository.update(
      { id, organizationId },
      { name: dto.name.trim(), isActive: dto.isActive ?? true, updated_by_id: userId },
    );
    return this.findOne(id, organizationId);
  }

  async remove(id: number, userId: string, organizationId: string) {
    await this.ensureExists(id, organizationId);
    await this.repository.update({ id, organizationId }, { deleted_by_id: userId });
    return this.repository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: number, organizationId: string) {
    await this.ensureExists(id, organizationId, true);
    return this.repository.delete({ id, organizationId });
  }

  async restore(id: number, organizationId: string) {
    await this.ensureExists(id, organizationId, true);
    return this.repository.restore({ id, organizationId });
  }

  private async ensureNameIsUnique(name: string, organizationId: string, ignoreId?: number) {
    const queryBuilder = this.repository
      .createQueryBuilder('gmtCostScope')
      .where('LOWER(TRIM(gmtCostScope.name)) = :name', { name: name.trim().toLowerCase() })
      .andWhere('gmtCostScope.organization_id = :organizationId', { organizationId })
      .andWhere('gmtCostScope.deleted_at IS NULL');
    if (ignoreId !== undefined) queryBuilder.andWhere('gmtCostScope.id != :ignoreId', { ignoreId });
    if (await queryBuilder.getOne()) throw new BadRequestException('GMT cost scope already exists');
  }

  private async ensureExists(id: number, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.repository
      .createQueryBuilder('gmtCostScope')
      .where('gmtCostScope.id = :id', { id })
      .andWhere('gmtCostScope.organization_id = :organizationId', { organizationId });
    if (includeDeleted) queryBuilder.withDeleted();
    else queryBuilder.andWhere('gmtCostScope.deleted_at IS NULL');
    const record = await queryBuilder.getOne();
    if (!record) throw new NotFoundException('GMT cost scope not found in the selected organization.');
    return record;
  }

  private normalizeUpdatedAt<T extends { updated_at?: Date | null; updated_by_id?: string | null; updated_by_user?: unknown }>(value: T): T {
    if (!value.updated_by_id && !value.updated_by_user) value.updated_at = null;
    return value;
  }

  private normalizeUpdatedAtList<T extends { updated_at?: Date | null; updated_by_id?: string | null; updated_by_user?: unknown }>(values: T[]) {
    return values.map((value) => this.normalizeUpdatedAt(value));
  }
}
