import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { FilterDepartmentDto } from './dto/filter-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entity/department.entity';

@Injectable()
export class DepartmentService {
    constructor(
        @InjectRepository(Department)
        private departmentRepository: Repository<Department>,
    ) { }

    async create(dto: CreateDepartmentDto, organizationId: string) {
        const normalizedDepartment = {
            departmentName: dto.departmentName.trim(),
            description: this.nullableString(dto.description),
            isActive: dto.isActive === undefined ? true : this.parseBoolean(dto.isActive),
        };
        await this.ensureDepartmentNameIsUnique(normalizedDepartment.departmentName, organizationId);

        const department = this.departmentRepository.create({
            ...normalizedDepartment,
            organizationId,
        });

        const saved = await this.departmentRepository.save(department);
        return this.findOne(saved.id, organizationId);
    }

    buildUploadTemplate() {
        return 'departmentName,description,isActive';
    }

    async importFromTemplate(file: Express.Multer.File | undefined, userId: string, organizationId: string) {
        if (!file?.buffer?.length) {
            throw new BadRequestException('Please upload a department template file.');
        }

        const rows = this.parseDepartmentTemplate(file.buffer.toString('utf8'));

        if (!rows.length) {
            return {
                inserted: 0,
                skipped: 0,
            };
        }

        const normalizedRows = rows.map((row) => ({
            departmentName: row.departmentName?.trim(),
            description: this.nullableString(row.description),
            isActive: row.isActive ?? true,
        }));
        const uniqueNames = [
            ...new Set(
                normalizedRows
                    .map((row) => row.departmentName?.trim().toLowerCase())
                    .filter((name): name is string => Boolean(name)),
            ),
        ];
        const existingDepartments = uniqueNames.length
            ? await this.departmentRepository
                .createQueryBuilder('department')
                .withDeleted()
                .select(['department.departmentName'])
                .where('department.organization_id = :organizationId', { organizationId })
                .andWhere('LOWER(TRIM(department.departmentName)) IN (:...names)', { names: uniqueNames })
                .getMany()
            : [];

        const existingNameSet = new Set(
            existingDepartments
                .map((department) => department.departmentName?.trim().toLowerCase())
                .filter((name): name is string => Boolean(name)),
        );
        const seenNameSet = new Set<string>();
        const departmentsToCreate = normalizedRows
            .filter((row) => {
                const name = row.departmentName?.trim().toLowerCase();

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
                const departmentName = row.departmentName?.trim();

                return this.departmentRepository.create({
                    departmentName: departmentName as string,
                    description: this.nullableString(row.description),
                    isActive: row.isActive ?? true,
                    organizationId,
                    created_by_id: userId,
                    updated_by_id: null as unknown as string,
                    updated_at: null as unknown as Date,
                });
            });

        if (!departmentsToCreate.length) {
            return {
                inserted: 0,
                skipped: rows.length,
            };
        }

        const savedDepartments = await this.departmentRepository.save(departmentsToCreate);
        await this.departmentRepository
            .createQueryBuilder()
            .update(Department)
            .set({
                updated_by_id: null,
                updated_at: () => 'NULL',
            } as unknown as Partial<Department>)
            .where('id IN (:...ids)', { ids: savedDepartments.map((department) => department.id) })
            .execute();

        return {
            inserted: savedDepartments.length,
            skipped: rows.length - savedDepartments.length,
        };
    }

    async findAll(
        paginationDto: PaginationDto,
        filters?: Partial<FilterDepartmentDto>,
        organizationId?: string,
    ): Promise<PaginatedResponseDto<Department>> {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;
        const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';

        const queryBuilder = this.departmentRepository
            .createQueryBuilder('department')
            .leftJoinAndSelect('department.organization', 'organization')
            .leftJoinAndSelect('department.created_by_user', 'created_by_user')
            .leftJoinAndSelect('department.updated_by_user', 'updated_by_user')
            .leftJoinAndSelect('department.deleted_by_user', 'deleted_by_user')
            .where('department.organization_id = :organizationId', { organizationId })
            .skip(skip)
            .take(limit)
            .orderBy('department.created_at', 'DESC');

        if (deletedOnly) {
            queryBuilder.withDeleted().andWhere('department.deleted_at IS NOT NULL');
        } else {
            queryBuilder.andWhere('department.deleted_at IS NULL');
        }

        if (filters?.departmentName) {
            queryBuilder.andWhere('department.departmentName ILIKE :departmentName', {
                departmentName: `%${filters.departmentName}%`,
            });
        }

        if (filters?.isActive !== undefined && filters.isActive !== '') {
            queryBuilder.andWhere('department.isActive = :isActive', {
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
        const department = await this.departmentRepository
            .createQueryBuilder('department')
            .leftJoinAndSelect('department.organization', 'organization')
            .leftJoinAndSelect('department.created_by_user', 'created_by_user')
            .leftJoinAndSelect('department.updated_by_user', 'updated_by_user')
            .where('department.id = :id', { id })
            .andWhere('department.organization_id = :organizationId', { organizationId })
            .andWhere('department.deleted_at IS NULL')
            .getOne();

        if (!department) {
            throw new NotFoundException('Department not found in the selected organization.');
        }

        return department;
    }

    async update(id: string, dto: UpdateDepartmentDto, organizationId: string) {
        const department = await this.ensureDepartmentExists(id, organizationId);

        if (dto.departmentName) {
            await this.ensureDepartmentNameIsUnique(dto.departmentName, organizationId, id);
        }

        Object.assign(department, dto);

        const saved = await this.departmentRepository.save(department);
        return this.findOne(saved.id, organizationId);
    }

    async remove(id: string, deletedById: string, organizationId: string) {
        await this.ensureDepartmentExists(id, organizationId);
        await this.departmentRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
        return this.departmentRepository.softDelete({ id, organizationId });
    }

    async permanentRemove(id: string, organizationId: string) {
        await this.ensureDepartmentExists(id, organizationId, true);
        return this.departmentRepository.delete({ id, organizationId });
    }

    async restore(id: string, organizationId: string) {
        await this.ensureDepartmentExists(id, organizationId, true);
        return this.departmentRepository.restore({ id, organizationId });
    }

    private async ensureDepartmentNameIsUnique(departmentName: string, organizationId: string, ignoreId?: string) {
        const queryBuilder = this.departmentRepository
            .createQueryBuilder('department')
            .where('LOWER(TRIM(department.departmentName)) = :departmentName', {
                departmentName: departmentName.trim().toLowerCase(),
            })
            .andWhere('department.organization_id = :organizationId', { organizationId })
            .andWhere('department.deleted_at IS NULL');

        if (ignoreId) {
            queryBuilder.andWhere('department.id != :ignoreId', { ignoreId });
        }

        const existing = await queryBuilder.getOne();

        if (existing) {
            throw new BadRequestException('Department already exists.');
        }
    }

    private async ensureDepartmentExists(id: string, organizationId: string, includeDeleted = false) {
        const queryBuilder = this.departmentRepository
            .createQueryBuilder('department')
            .where('department.id = :id', { id })
            .andWhere('department.organization_id = :organizationId', { organizationId });

        if (includeDeleted) {
            queryBuilder.withDeleted();
        } else {
            queryBuilder.andWhere('department.deleted_at IS NULL');
        }

        const department = await queryBuilder.getOne();

        if (!department) {
            throw new NotFoundException('Department not found in the selected organization.');
        }

        return department;
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

    private parseDepartmentTemplate(content: string) {
        const lines = content
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length === 0) {
            throw new BadRequestException('The uploaded template does not contain any department rows.');
        }

        if (lines.length === 1) {
            return [];
        }

        const headers = this.parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
        const departmentNameIndex = headers.indexOf('departmentname');
        const descriptionIndex = headers.indexOf('description');
        const isActiveIndex = headers.indexOf('isactive');

        if (departmentNameIndex === -1 || isActiveIndex === -1) {
            throw new BadRequestException('The uploaded template must include departmentName and isActive columns.');
        }

        return lines.slice(1).flatMap((line) => {
            const columns = this.parseCsvLine(line);
            const departmentName = columns[departmentNameIndex]?.trim() ?? '';
            const description = descriptionIndex === -1 ? null : columns[descriptionIndex]?.trim() || null;
            const isActive = this.parseBoolean(columns[isActiveIndex]);

            if (!departmentName) {
                return [];
            }

            return [
                {
                    departmentName,
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
