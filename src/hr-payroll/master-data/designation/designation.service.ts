import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { FilterDesignationDto } from './dto/filter-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { Designation } from './entity/designation.entity';

@Injectable()
export class DesignationService {
    constructor(
        @InjectRepository(Designation)
        private designationRepository: Repository<Designation>,
    ) { }

    async create(dto: CreateDesignationDto, organizationId: string) {
        const normalizedDesignation = {
            designationName: dto.designationName.trim(),
            description: this.nullableString(dto.description),
            isActive: dto.isActive === undefined ? true : this.parseBoolean(dto.isActive),
        };
        await this.ensureDesignationNameIsUnique(normalizedDesignation.designationName, organizationId);

        const designation = this.designationRepository.create({
            ...normalizedDesignation,
            organizationId,
        });

        const saved = await this.designationRepository.save(designation);
        return this.findOne(saved.id, organizationId);
    }

    buildUploadTemplate() {
        return 'designationName,description,isActive';
    }

    async importFromTemplate(file: Express.Multer.File | undefined, userId: string, organizationId: string) {
        if (!file?.buffer?.length) {
            throw new BadRequestException('Please upload a designation template file.');
        }

        const rows = this.parseDesignationTemplate(file.buffer.toString('utf8'));

        if (!rows.length) {
            return {
                inserted: 0,
                skipped: 0,
            };
        }

        const normalizedRows = rows.map((row) => ({
            designationName: row.designationName?.trim(),
            description: this.nullableString(row.description),
            isActive: row.isActive ?? true,
        }));
        const uniqueNames = [
            ...new Set(
                normalizedRows
                    .map((row) => row.designationName?.trim().toLowerCase())
                    .filter((name): name is string => Boolean(name)),
            ),
        ];
        const existingDesignations = uniqueNames.length
            ? await this.designationRepository
                .createQueryBuilder('designation')
                .withDeleted()
                .select(['designation.designationName'])
                .where('designation.organization_id = :organizationId', { organizationId })
                .andWhere('LOWER(TRIM(designation.designationName)) IN (:...names)', { names: uniqueNames })
                .getMany()
            : [];

        const existingNameSet = new Set(
            existingDesignations
                .map((designation) => designation.designationName?.trim().toLowerCase())
                .filter((name): name is string => Boolean(name)),
        );
        const seenNameSet = new Set<string>();
        const designationsToCreate = normalizedRows
            .filter((row) => {
                const name = row.designationName?.trim().toLowerCase();

                if (!name) {
                    return false;
                }

                if (existingNameSet.has(name)) {
                    return false;
                }

                if (seenNameSet.has(name)) {
                    return false;
                }

                seenNameSet.add(name);
                return true;
            })
            .map((row) => {
                const designationName = row.designationName?.trim();

                return this.designationRepository.create({
                    designationName: designationName as string,
                    description: this.nullableString(row.description),
                    isActive: row.isActive ?? true,
                    organizationId,
                    created_by_id: userId,
                    updated_by_id: null as unknown as string,
                    updated_at: null as unknown as Date,
                });
            });

        if (!designationsToCreate.length) {
            return {
                inserted: 0,
                skipped: rows.length,
            };
        }

        const savedDesignations = await this.designationRepository.save(designationsToCreate);
        await this.designationRepository
            .createQueryBuilder()
            .update(Designation)
            .set({
                updated_by_id: null,
                updated_at: () => 'NULL',
            } as unknown as Partial<Designation>)
            .where('id IN (:...ids)', { ids: savedDesignations.map((designation) => designation.id) })
            .execute();

        return {
            inserted: savedDesignations.length,
            skipped: rows.length - savedDesignations.length,
        };
    }

    async findAll(
        paginationDto: PaginationDto,
        filters?: Partial<FilterDesignationDto>,
        organizationId?: string,
    ): Promise<PaginatedResponseDto<Designation>> {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;
        const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';

        const queryBuilder = this.designationRepository
            .createQueryBuilder('designation')
            .leftJoinAndSelect('designation.organization', 'organization')
            .leftJoinAndSelect('designation.created_by_user', 'created_by_user')
            .leftJoinAndSelect('designation.updated_by_user', 'updated_by_user')
            .leftJoinAndSelect('designation.deleted_by_user', 'deleted_by_user')
            .where('designation.organization_id = :organizationId', { organizationId })
            .skip(skip)
            .take(limit)
            .orderBy('designation.created_at', 'DESC');

        if (deletedOnly) {
            queryBuilder.withDeleted().andWhere('designation.deleted_at IS NOT NULL');
        } else {
            queryBuilder.andWhere('designation.deleted_at IS NULL');
        }

        if (filters?.designationName) {
            queryBuilder.andWhere('designation.designationName ILIKE :designationName', {
                designationName: `%${filters.designationName}%`,
            });
        }

        if (filters?.isActive !== undefined && filters.isActive !== '') {
            queryBuilder.andWhere('designation.isActive = :isActive', {
                isActive: filters.isActive === 'true',
            });
        }

        const [items, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

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

    async findOne(id: string, organizationId: string) {
        const designation = await this.designationRepository
            .createQueryBuilder('designation')
            .leftJoinAndSelect('designation.organization', 'organization')
            .leftJoinAndSelect('designation.created_by_user', 'created_by_user')
            .leftJoinAndSelect('designation.updated_by_user', 'updated_by_user')
            .where('designation.id = :id', { id })
            .andWhere('designation.organization_id = :organizationId', { organizationId })
            .andWhere('designation.deleted_at IS NULL')
            .getOne();

        if (!designation) {
            throw new NotFoundException('Designation not found in the selected organization.');
        }

        return designation;
    }

    async update(id: string, dto: UpdateDesignationDto, organizationId: string) {
        const designation = await this.ensureDesignationExists(id, organizationId);

        if (dto.designationName) {
            await this.ensureDesignationNameIsUnique(dto.designationName, organizationId, id);
        }

        Object.assign(designation, dto);

        const saved = await this.designationRepository.save(designation);
        return this.findOne(saved.id, organizationId);
    }

    async remove(id: string, deletedById: string, organizationId: string) {
        await this.ensureDesignationExists(id, organizationId);
        await this.designationRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
        return this.designationRepository.softDelete({ id, organizationId });
    }

    async permanentRemove(id: string, organizationId: string) {
        await this.ensureDesignationExists(id, organizationId, true);
        return this.designationRepository.delete({ id, organizationId });
    }

    async restore(id: string, organizationId: string) {
        await this.ensureDesignationExists(id, organizationId, true);
        return this.designationRepository.restore({ id, organizationId });
    }

    private async ensureDesignationNameIsUnique(designationName: string, organizationId: string, ignoreId?: string) {
        const queryBuilder = this.designationRepository
            .createQueryBuilder('designation')
            .where('LOWER(TRIM(designation.designationName)) = :designationName', {
                designationName: designationName.trim().toLowerCase(),
            })
            .andWhere('designation.organization_id = :organizationId', { organizationId })
            .andWhere('designation.deleted_at IS NULL');

        if (ignoreId) {
            queryBuilder.andWhere('designation.id != :ignoreId', { ignoreId });
        }

        const existing = await queryBuilder.getOne();

        if (existing) {
            throw new BadRequestException('Designation already exists.');
        }
    }

    private async ensureDesignationExists(id: string, organizationId: string, includeDeleted = false) {
        const queryBuilder = this.designationRepository
            .createQueryBuilder('designation')
            .where('designation.id = :id', { id })
            .andWhere('designation.organization_id = :organizationId', { organizationId });

        if (includeDeleted) {
            queryBuilder.withDeleted();
        } else {
            queryBuilder.andWhere('designation.deleted_at IS NULL');
        }

        const designation = await queryBuilder.getOne();

        if (!designation) {
            throw new NotFoundException('Designation not found in the selected organization.');
        }

        return designation;
    }

    private nullableString(value: string | null | undefined) {
        const trimmedValue = value?.trim() ?? '';
        return trimmedValue || undefined;
    }

    private parseBoolean(value: boolean | string | null | undefined) {
        if (typeof value === 'boolean') {
            return value;
        }

        const normalizedValue = value?.trim().toLowerCase();
        if (!normalizedValue) {
            return true;
        }

        return ['true', 'yes', 'y', '1', 'active'].includes(normalizedValue);
    }

    private parseDesignationTemplate(content: string) {
        const lines = content
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length === 0) {
            throw new BadRequestException('The uploaded template does not contain any designation rows.');
        }

        if (lines.length === 1) {
            return [];
        }

        const headers = this.parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
        const designationNameIndex = headers.indexOf('designationname');
        const descriptionIndex = headers.indexOf('description');
        const isActiveIndex = headers.indexOf('isactive');

        if (designationNameIndex === -1 || isActiveIndex === -1) {
            throw new BadRequestException('The uploaded template must include designationName and isActive columns.');
        }

        return lines.slice(1).flatMap((line) => {
            const columns = this.parseCsvLine(line);
            const designationName = columns[designationNameIndex]?.trim() ?? '';
            const description = descriptionIndex === -1 ? null : columns[descriptionIndex]?.trim() || null;
            const isActive = this.parseBoolean(columns[isActiveIndex]);

            if (!designationName) {
                return [];
            }

            return [
                {
                    designationName,
                    description,
                    isActive,
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
}
