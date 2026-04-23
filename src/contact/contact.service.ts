import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FilterContactDto } from './dto/filter-contact.dto';
import { Contact } from '../contact/entity/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
    constructor(
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
    ) { }

    async create(contactDto: CreateContactDto) {
        const contact = this.contactRepository.create(contactDto);
        return this.contactRepository.save(contact);
    }

    async findAll(
        paginationDto: PaginationDto,
        filters?: Partial<FilterContactDto>,
    ): Promise<PaginatedResponseDto<Contact>> {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.contactRepository
            .createQueryBuilder('contact')
            .leftJoinAndSelect('contact.users', 'users')
            .skip(skip)
            .take(limit)
            .orderBy('contact.created_at', 'DESC');

        if (filters?.contact_catagory) {
            queryBuilder.andWhere('contact.contact_catagory = :contact_catagory', {
                contact_catagory: filters.contact_catagory,
            });
        }
        if (filters?.remarks) {
            queryBuilder.andWhere('contact.remarks = :remarks', {
                remarks: filters.remarks,
            });
        }
        if (filters?.user_id) {
            queryBuilder.andWhere('contact.user_id = :user_id', {
                user_id: filters.user_id,
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

    findOne(id: string) {
        return this.contactRepository.findOne({
            where: { id },
            relations: ['users'],
            withDeleted: false, // Only get non-deleted users
        });
    }

    update(id: string, dto: CreateContactDto) {
        return this.contactRepository.update(id, dto);
    }

    remove(id: string) {
        return this.contactRepository.softDelete(id);
    }

    // Method to permanently delete a user (for admin purposes)
    permanentRemove(id: string) {
        return this.contactRepository.delete(id);
    }

    // Method to restore a soft-deleted user
    restore(id: string) {
        return this.contactRepository.restore(id);
    }
}

