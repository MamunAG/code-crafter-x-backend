import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Factory } from './entity/factory.entity';
import { CreateFactoryDto } from './dto/create-factory.dto';
import { FilterFactoryDto } from './dto/filter-factory.dto';
import { UpdateFactoryDto } from './dto/update-factory.dto';

type FactoryListFilters = Partial<FilterFactoryDto> & {
    deletedOnly?: string | boolean;
};

@Injectable()
export class FactoryService {
    constructor(
        @InjectRepository(Factory)
        private factoryRepository: Repository<Factory>,
    ) { }

    async create(factoryDto: CreateFactoryDto, organizationId: string) {
        const normalizedFactory = this.normalizeFactoryPayload(factoryDto);
        await this.ensureFactoryIsUnique(normalizedFactory.name, normalizedFactory.code, organizationId);

        const factory = this.factoryRepository.create({
            ...normalizedFactory,
            organizationId,
        });

        const saved = await this.factoryRepository.save(factory);

        await this.factoryRepository
            .createQueryBuilder()
            .update(Factory)
            .set({
                updated_by_id: null,
                updated_at: () => 'NULL',
            } as unknown as Partial<Factory>)
            .where('id = :id', { id: saved.id })
            .andWhere('organization_id = :organizationId', { organizationId })
            .execute();

        return this.normalizeUpdatedAt(await this.findOne(saved.id, organizationId));
    }

    buildUploadTemplate() {
        return 'name,displayName,code,contact,email,address,isActive,remarks';
    }

    async importFromTemplate(file: Express.Multer.File | undefined, userId: string, organizationId: string) {
        if (!file?.buffer?.length) {
            throw new BadRequestException('Please upload a factory template file.');
        }

        const rows = this.parseFactoryTemplate(file.buffer.toString('utf8'));

        if (!rows.length) {
            return { inserted: 0, skipped: 0 };
        }

        const normalizedRows = rows.map((row) => this.normalizeFactoryPayload(row));

        const uniqueCodes = [
            ...new Set(
                normalizedRows
                    .map((row) => row.code?.trim().toLowerCase())
                    .filter((code): code is string => Boolean(code)),
            ),
        ];

        const uniqueNames = [
            ...new Set(
                normalizedRows
                    .map((row) => row.name?.trim().toLowerCase())
                    .filter((name): name is string => Boolean(name)),
            ),
        ];

        const existingFactories = await this.factoryRepository
            .createQueryBuilder('factory')
            .withDeleted()
            .select(['factory.name', 'factory.code'])
            .where('factory.organization_id = :organizationId', { organizationId })
            .andWhere(
                '(LOWER(TRIM(factory.name)) IN (:...names) OR LOWER(TRIM(factory.code)) IN (:...codes))',
                {
                    names: uniqueNames.length ? uniqueNames : ['__none__'],
                    codes: uniqueCodes.length ? uniqueCodes : ['__none__'],
                },
            )
            .getMany();

        const existingNameSet = new Set(
            existingFactories
                .map((factory) => factory.name?.trim().toLowerCase())
                .filter((name): name is string => Boolean(name)),
        );

        const existingCodeSet = new Set(
            existingFactories
                .map((factory) => factory.code?.trim().toLowerCase())
                .filter((code): code is string => Boolean(code)),
        );

        const seenNameSet = new Set<string>();
        const seenCodeSet = new Set<string>();

        const factoriesToCreate = normalizedRows
            .filter((row) => {
                const name = row.name?.trim().toLowerCase();
                const code = row.code?.trim().toLowerCase();

                if (!name) return false;
                if (existingNameSet.has(name) || seenNameSet.has(name)) return false;
                if (code && (existingCodeSet.has(code) || seenCodeSet.has(code))) return false;

                seenNameSet.add(name);
                if (code) seenCodeSet.add(code);

                return true;
            })
            .map((row) =>
                this.factoryRepository.create({
                    name: row.name,
                    displayName: row.displayName,
                    code: row.code,
                    contact: row.contact,
                    email: row.email,
                    address: row.address,
                    remarks: row.remarks,
                    isActive: row.isActive,
                    organizationId,
                    created_by_id: userId,
                    updated_by_id: null as unknown as string,
                    updated_at: null as unknown as Date,
                }),
            );

        if (!factoriesToCreate.length) {
            return { inserted: 0, skipped: rows.length };
        }

        const savedFactories = await this.factoryRepository.save(factoriesToCreate);

        await this.factoryRepository
            .createQueryBuilder()
            .update(Factory)
            .set({
                updated_by_id: null,
                updated_at: () => 'NULL',
            } as unknown as Partial<Factory>)
            .where('id IN (:...ids)', { ids: savedFactories.map((factory) => factory.id) })
            .execute();

        return {
            inserted: savedFactories.length,
            skipped: rows.length - savedFactories.length,
        };
    }

    async findAll(
        paginationDto: PaginationDto,
        filters?: FactoryListFilters,
        organizationId?: string,
    ): Promise<PaginatedResponseDto<Factory>> {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';
        const skip = (page - 1) * limit;

        const queryBuilder = this.factoryRepository
            .createQueryBuilder('factory')
            .leftJoinAndSelect('factory.created_by_user', 'created_by_user')
            .leftJoinAndSelect('factory.updated_by_user', 'updated_by_user')
            .leftJoinAndSelect('factory.deleted_by_user', 'deleted_by_user')
            .where('factory.organization_id = :organizationId', { organizationId })
            .skip(skip)
            .take(limit)
            .orderBy(deletedOnly ? 'factory.deleted_at' : 'factory.created_at', 'DESC');

        if (deletedOnly) {
            queryBuilder.withDeleted();
        }

        if (filters?.name) {
            queryBuilder.andWhere('factory.name ILIKE :name', { name: `%${filters.name}%` });
        }

        if (filters?.displayName) {
            queryBuilder.andWhere('factory.displayName ILIKE :displayName', { displayName: `%${filters.displayName}%` });
        }

        if (filters?.code) {
            queryBuilder.andWhere('factory.code ILIKE :code', { code: `%${filters.code}%` });
        }

        if (filters?.contact) {
            queryBuilder.andWhere('factory.contact ILIKE :contact', { contact: `%${filters.contact}%` });
        }

        if (filters?.email) {
            queryBuilder.andWhere('factory.email ILIKE :email', { email: `%${filters.email}%` });
        }

        if (filters?.address) {
            queryBuilder.andWhere('factory.address ILIKE :address', { address: `%${filters.address}%` });
        }

        if (filters?.remarks) {
            queryBuilder.andWhere('factory.remarks ILIKE :remarks', { remarks: `%${filters.remarks}%` });
        }

        if (filters?.isActive !== undefined && filters?.isActive !== '') {
            queryBuilder.andWhere('factory.isActive = :isActive', {
                isActive: this.parseBoolean(filters.isActive),
            });
        }

        if (deletedOnly) {
            queryBuilder.andWhere('factory.deleted_at IS NOT NULL');
        } else {
            queryBuilder.andWhere('factory.deleted_at IS NULL');
        }

        const [items, total] = await queryBuilder.getManyAndCount();

        return {
            items: this.normalizeUpdatedAtList(items),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
        };
    }

    findOne(id: string, organizationId: string) {
        return this.factoryRepository
            .createQueryBuilder('factory')
            .leftJoinAndSelect('factory.created_by_user', 'created_by_user')
            .leftJoinAndSelect('factory.updated_by_user', 'updated_by_user')
            .leftJoinAndSelect('factory.deleted_by_user', 'deleted_by_user')
            .where('factory.organization_id = :organizationId', { organizationId })
            .andWhere('factory.id = :id', { id })
            .andWhere('factory.deleted_at IS NULL')
            .getOne()
            .then((factory) => {
                if (!factory) {
                    throw new NotFoundException('Factory not found in the selected organization.');
                }

                return this.normalizeUpdatedAt(factory);
            });
    }

    async update(id: string, dto: UpdateFactoryDto, organizationId: string) {
        const normalizedFactory = this.normalizeFactoryPayload(dto);

        if (normalizedFactory.name || normalizedFactory.code) {
            await this.ensureFactoryIsUnique(normalizedFactory.name, normalizedFactory.code, organizationId, id);
        }

        await this.ensureFactoryExists(id, organizationId);
        await this.factoryRepository.update({ id, organizationId }, normalizedFactory);

        return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
    }

    async remove(id: string, deletedById: string, organizationId: string) {
        await this.ensureFactoryExists(id, organizationId);
        await this.factoryRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
        return this.factoryRepository.softDelete({ id, organizationId });
    }

    async permanentRemove(id: string, organizationId: string) {
        await this.ensureFactoryExists(id, organizationId, true);
        return this.factoryRepository.delete({ id, organizationId });
    }

    async restore(id: string, organizationId: string) {
        await this.ensureFactoryExists(id, organizationId, true);
        return this.factoryRepository.restore({ id, organizationId });
    }

    private async ensureFactoryIsUnique(name?: string | null, code?: string | null, organizationId?: string, ignoreId?: string) {
        const normalizedName = name?.trim().toLowerCase();
        const normalizedCode = code?.trim().toLowerCase();

        if (!normalizedName && !normalizedCode) return;

        const queryBuilder = this.factoryRepository
            .createQueryBuilder('factory')
            .where('factory.organization_id = :organizationId', { organizationId })
            .andWhere('factory.deleted_at IS NULL');

        if (normalizedName && normalizedCode) {
            queryBuilder.andWhere('(LOWER(TRIM(factory.name)) = :name OR LOWER(TRIM(factory.code)) = :code)', {
                name: normalizedName,
                code: normalizedCode,
            });
        } else if (normalizedName) {
            queryBuilder.andWhere('LOWER(TRIM(factory.name)) = :name', { name: normalizedName });
        } else if (normalizedCode) {
            queryBuilder.andWhere('LOWER(TRIM(factory.code)) = :code', { code: normalizedCode });
        }

        if (ignoreId !== undefined) {
            queryBuilder.andWhere('factory.id != :ignoreId', { ignoreId });
        }

        const existing = await queryBuilder.getOne();

        if (existing) {
            throw new BadRequestException('Factory already exists');
        }
    }

    private normalizeFactoryPayload(dto: Partial<CreateFactoryDto>): Partial<Factory> {
        const payload: Partial<Factory> = {};

        if (dto.name !== undefined) payload.name = dto.name.trim();
        if (dto.displayName !== undefined) payload.displayName = dto.displayName.trim();
        if ('code' in dto) payload.code = this.nullableString(dto.code);
        if ('contact' in dto) payload.contact = this.nullableString(dto.contact);
        if ('email' in dto) payload.email = this.nullableString(dto.email)?.toLowerCase() ?? null;
        if ('address' in dto) payload.address = this.nullableString(dto.address);
        if ('remarks' in dto) payload.remarks = this.nullableString(dto.remarks);
        if (dto.isActive !== undefined) payload.isActive = dto.isActive;

        return payload;
    }

    private nullableString(value: string | null | undefined) {
        const trimmedValue = value?.trim() ?? '';
        return trimmedValue || null;
    }

    private parseFactoryTemplate(content: string) {
        const lines = content
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length === 0) {
            throw new BadRequestException('The uploaded template does not contain any factory rows.');
        }

        if (lines.length === 1) return [];

        const headers = this.parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());

        const nameIndex = headers.indexOf('name');
        const displayNameIndex = headers.indexOf('displayname');
        const codeIndex = headers.indexOf('code');
        const contactIndex = headers.indexOf('contact');
        const emailIndex = headers.indexOf('email');
        const addressIndex = headers.indexOf('address');
        const isActiveIndex = headers.indexOf('isactive');
        const remarksIndex = headers.indexOf('remarks');

        if (nameIndex === -1 || displayNameIndex === -1 || isActiveIndex === -1) {
            throw new BadRequestException('The uploaded template must include name, displayName, and isActive columns.');
        }

        return lines.slice(1).flatMap((line) => {
            const columns = this.parseCsvLine(line);

            const name = columns[nameIndex]?.trim() ?? '';
            const displayName = columns[displayNameIndex]?.trim() ?? '';
            const code = codeIndex === -1 ? null : columns[codeIndex]?.trim() || null;
            const contact = contactIndex === -1 ? null : columns[contactIndex]?.trim() || null;
            const email = emailIndex === -1 ? null : columns[emailIndex]?.trim() || null;
            const address = addressIndex === -1 ? null : columns[addressIndex]?.trim() || null;
            const remarks = remarksIndex === -1 ? '' : columns[remarksIndex]?.trim() ?? '';
            const isActive = this.parseBoolean(columns[isActiveIndex]);

            if (!name || !displayName) return [];

            return [{ name, displayName, code, contact, email, address, remarks: remarks || null, isActive }];
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

    private parseBoolean(value?: string | null) {
        const normalizedValue = value?.trim().toLowerCase();

        if (!normalizedValue) return true;

        return ['true', 'yes', 'y', '1', 'active'].includes(normalizedValue);
    }

    private async ensureFactoryExists(id: string, organizationId: string, includeDeleted = false) {
        const queryBuilder = this.factoryRepository
            .createQueryBuilder('factory')
            .where('factory.id = :id', { id })
            .andWhere('factory.organization_id = :organizationId', { organizationId });

        if (includeDeleted) {
            queryBuilder.withDeleted();
        } else {
            queryBuilder.andWhere('factory.deleted_at IS NULL');
        }

        const factory = await queryBuilder.getOne();

        if (!factory) {
            throw new NotFoundException('Factory not found in the selected organization.');
        }

        return factory;
    }

    private normalizeUpdatedAt<T extends { updated_at?: Date | null; updated_by_id?: string | null; updated_by_user?: unknown } | null>(value: T): T {
        if (!value) return value;

        if (!value.updated_by_id && !value.updated_by_user) {
            value.updated_at = null;
        }

        return value;
    }

    private normalizeUpdatedAtList<T extends { updated_at?: Date | null; updated_by_id?: string | null; updated_by_user?: unknown }>(values: T[]): T[] {
        return values.map((value) => this.normalizeUpdatedAt(value));
    }
}