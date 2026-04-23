import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Country } from 'src/app-configuration/country/entity/country.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Buyer } from './entity/buyer.entity';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { FilterBuyerDto } from './dto/filter-buyer.dto';
import { UpdateBuyerDto } from './dto/update-buyer.dto';

@Injectable()
export class BuyerService {
  constructor(
    @InjectRepository(Buyer)
    private buyerRepository: Repository<Buyer>,

    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
  ) { }

  async create(buyerDto: CreateBuyerDto) {
    await this.ensureEmailIsUnique(buyerDto.email);
    const country = await this.findCountryOrFail(buyerDto.countryId);

    const buyer = this.buyerRepository.create({
      ...buyerDto,
      country,
    });

    const saved = await this.buyerRepository.save(buyer);
    return this.findOne(saved.id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterBuyerDto>,
  ): Promise<PaginatedResponseDto<Buyer>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.buyerRepository
      .createQueryBuilder('buyer')
      .leftJoinAndSelect('buyer.country', 'country')
      .leftJoinAndSelect('buyer.created_by_user', 'created_by_user')
      .leftJoinAndSelect('buyer.updated_by_user', 'updated_by_user')
      .skip(skip)
      .take(limit)
      .orderBy('buyer.created_at', 'DESC');

    if (filters?.name) {
      queryBuilder.andWhere('buyer.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.displayName) {
      queryBuilder.andWhere('buyer.displayName ILIKE :displayName', {
        displayName: `%${filters.displayName}%`,
      });
    }

    if (filters?.contact) {
      queryBuilder.andWhere('buyer.contact ILIKE :contact', {
        contact: `%${filters.contact}%`,
      });
    }

    if (filters?.email) {
      queryBuilder.andWhere('buyer.email ILIKE :email', {
        email: `%${filters.email}%`,
      });
    }

    if (filters?.countryId !== undefined) {
      queryBuilder.andWhere('country.id = :countryId', {
        countryId: filters.countryId,
      });
    }

    if (filters?.address) {
      queryBuilder.andWhere('buyer.address ILIKE :address', {
        address: `%${filters.address}%`,
      });
    }

    if (filters?.isActive) {
      queryBuilder.andWhere('buyer.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.remarks) {
      queryBuilder.andWhere('buyer.remarks ILIKE :remarks', {
        remarks: `%${filters.remarks}%`,
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
    return this.buyerRepository
      .createQueryBuilder('buyer')
      .leftJoinAndSelect('buyer.country', 'country')
      .leftJoinAndSelect('buyer.created_by_user', 'created_by_user')
      .leftJoinAndSelect('buyer.updated_by_user', 'updated_by_user')
      .where('buyer.id = :id', { id })
      .andWhere('buyer.deleted_at IS NULL')
      .getOne();
  }

  async update(id: string, dto: UpdateBuyerDto) {
    const buyer = await this.buyerRepository.findOne({
      where: { id },
      relations: ['country'],
      withDeleted: false,
    });

    if (!buyer) {
      throw new BadRequestException('Buyer not found');
    }

    if (dto.email) {
      await this.ensureEmailIsUnique(dto.email, id);
    }

    if (dto.countryId !== undefined) {
      buyer.country = await this.findCountryOrFail(dto.countryId);
    }

    Object.assign(buyer, dto);
    const saved = await this.buyerRepository.save(buyer);
    return this.findOne(saved.id);
  }

  remove(id: string) {
    return this.buyerRepository.softDelete(id);
  }

  permanentRemove(id: string) {
    return this.buyerRepository.delete(id);
  }

  restore(id: string) {
    return this.buyerRepository.restore(id);
  }

  private async ensureEmailIsUnique(email: string, ignoreId?: string) {
    if (!email) {
      return;
    }

    const queryBuilder = this.buyerRepository
      .createQueryBuilder('buyer')
      .where('LOWER(TRIM(buyer.email)) = :email', {
        email: email.trim().toLowerCase(),
      })
      .andWhere('buyer.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('buyer.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Buyer already exists');
    }
  }

  private async findCountryOrFail(countryId: number) {
    const country = await this.countryRepository.findOne({
      where: { id: countryId },
    });

    if (!country) {
      throw new BadRequestException('Country not found');
    }

    return country;
  }
}
