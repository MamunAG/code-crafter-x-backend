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
    await this.uomRepository
      .createQueryBuilder()
      .update(Unit)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Unit>)
      .where('id = :id', { id: saved.id })
      .andWhere('organization_id = :organizationId', { organizationId })
      .execute();
    return this.findOne(saved.id, organizationId);
  }

  buildUploadTemplate() {
    return 'name,shortName,isActive';
  }

  async importFromTemplate(file: Express.Multer.File | undefined, userId: string, organizationId: string) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Please upload a UOM template file.');
    }

    const rows = this.parseUnitTemplate(file.buffer.toString('utf8'));
    const uniqueNames = [...new Set(rows.map((row) => row.name.trim()).filter(Boolean))];

    if (!uniqueNames.length) {
      return {
        inserted: 0,
        skipped: 0,
      };
    }

    const existingUnits = await this.uomRepository
      .createQueryBuilder('uom')
      .withDeleted()
      .select(['uom.name'])
      .where('uom.organization_id = :organizationId', { organizationId })
      .andWhere('LOWER(TRIM(uom.name)) IN (:...names)', {
        names: uniqueNames.map((name) => name.toLowerCase()),
      })
      .getMany();

    const existingNameSet = new Set(existingUnits.map((uom) => uom.name.trim().toLowerCase()));
    const newUnits = rows
      .filter((row) => !existingNameSet.has(row.name.trim().toLowerCase()))
      .map((row) =>
        this.uomRepository.create({
          name: row.name.trim(),
          shortName: row.shortName.trim(),
          isActive: row.isActive,
          organizationId,
          created_by_id: userId,
          updated_by_id: null as unknown as string,
          updated_at: null as unknown as Date,
        }),
      );

    if (!newUnits.length) {
      return {
        inserted: 0,
        skipped: rows.length,
      };
    }

    const savedUnits = await this.uomRepository.save(newUnits);
    await this.uomRepository
      .createQueryBuilder()
      .update(Unit)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Unit>)
      .where('id IN (:...ids)', { ids: savedUnits.map((uom) => uom.id) })
      .execute();

    return {
      inserted: savedUnits.length,
      skipped: rows.length - savedUnits.length,
    };
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

  private parseUnitTemplate(content: string) {
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new BadRequestException('The uploaded template does not contain any UOM rows.');
    }

    if (lines.length === 1) {
      return [];
    }

    const headers = this.parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const shortNameIndex = headers.indexOf('shortname');
    const activeIndex = headers.indexOf('isactive');

    if (nameIndex === -1 || shortNameIndex === -1) {
      throw new BadRequestException('The uploaded template must include name and shortName columns.');
    }

    return lines.slice(1).flatMap((line) => {
      const columns = this.parseCsvLine(line);
      const name = columns[nameIndex]?.trim() ?? '';
      const shortName = columns[shortNameIndex]?.trim() ?? '';

      if (!name || !shortName) {
        return [];
      }

      return [
        {
          name,
          shortName,
          isActive: activeIndex === -1 ? 'Y' : this.parseActiveValue(columns[activeIndex]),
        },
      ];
    });
  }

  private parseCsvLine(line: string) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      const nextCharacter = line[index + 1];

      if (character === '"' && nextCharacter === '"') {
        current += '"';
        index += 1;
        continue;
      }

      if (character === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (character === ',' && !inQuotes) {
        values.push(current);
        current = '';
        continue;
      }

      current += character;
    }

    values.push(current);
    return values;
  }

  private parseActiveValue(value?: string) {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue) {
      return 'Y';
    }

    return ['true', 'yes', 'y', '1', 'active'].includes(normalizedValue) ? 'Y' : 'N';
  }
}
