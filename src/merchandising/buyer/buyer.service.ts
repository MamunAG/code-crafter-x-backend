import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(buyerDto: CreateBuyerDto, organizationId: string) {
    await this.ensureEmailIsUnique(buyerDto.email, organizationId);
    const country = await this.findCountryOrFail(buyerDto.countryId, organizationId);

    const buyer = this.buyerRepository.create({
      ...buyerDto,
      organizationId,
      country,
    });

    const saved = await this.buyerRepository.save(buyer);
    return this.findOne(saved.id, organizationId);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterBuyerDto>,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Buyer>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.buyerRepository
      .createQueryBuilder('buyer')
      .leftJoinAndSelect('buyer.country', 'country')
      .leftJoinAndSelect('buyer.created_by_user', 'created_by_user')
      .leftJoinAndSelect('buyer.updated_by_user', 'updated_by_user')
      .where('buyer.organization_id = :organizationId', { organizationId })
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

  findOne(id: string, organizationId: string) {
    return this.buyerRepository
      .createQueryBuilder('buyer')
      .leftJoinAndSelect('buyer.country', 'country')
      .leftJoinAndSelect('buyer.created_by_user', 'created_by_user')
      .leftJoinAndSelect('buyer.updated_by_user', 'updated_by_user')
      .where('buyer.organization_id = :organizationId', { organizationId })
      .andWhere('buyer.id = :id', { id })
      .andWhere('buyer.deleted_at IS NULL')
      .getOne()
      .then((buyer) => {
        if (!buyer) {
          throw new NotFoundException('Buyer not found in the selected organization.');
        }

        return buyer;
      });
  }

  async update(id: string, dto: UpdateBuyerDto, organizationId: string) {
    const buyer = await this.buyerRepository.findOne({
      where: { id, organizationId },
      relations: ['country'],
      withDeleted: false,
    });

    if (!buyer) {
      throw new BadRequestException('Buyer not found');
    }

    if (dto.email) {
      await this.ensureEmailIsUnique(dto.email, organizationId, id);
    }

    if (dto.countryId !== undefined) {
      buyer.country = await this.findCountryOrFail(dto.countryId, organizationId);
    }

    Object.assign(buyer, dto);
    const saved = await this.buyerRepository.save(buyer);
    return this.findOne(saved.id, organizationId);
  }

  async remove(id: string, organizationId: string) {
    await this.ensureBuyerExists(id, organizationId);
    return this.buyerRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: string, organizationId: string) {
    await this.ensureBuyerExists(id, organizationId, true);
    return this.buyerRepository.delete({ id, organizationId });
  }

  async restore(id: string, organizationId: string) {
    await this.ensureBuyerExists(id, organizationId, true);
    return this.buyerRepository.restore({ id, organizationId });
  }

  private async ensureEmailIsUnique(email: string, organizationId: string, ignoreId?: string) {
    if (!email) {
      return;
    }

    const queryBuilder = this.buyerRepository
      .createQueryBuilder('buyer')
      .where('LOWER(TRIM(buyer.email)) = :email', {
        email: email.trim().toLowerCase(),
      })
      .andWhere('buyer.organization_id = :organizationId', { organizationId })
      .andWhere('buyer.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('buyer.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Buyer already exists');
    }
  }

  private async findCountryOrFail(countryId: number, organizationId: string) {
    const country = await this.countryRepository.findOne({
      where: { id: countryId, organizationId },
    });

    if (!country) {
      throw new BadRequestException('Country not found in the selected organization.');
    }

    return country;
  }

  private async ensureBuyerExists(id: string, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.buyerRepository
      .createQueryBuilder('buyer')
      .where('buyer.id = :id', { id })
      .andWhere('buyer.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('buyer.deleted_at IS NULL');
    }

    const buyer = await queryBuilder.getOne();

    if (!buyer) {
      throw new NotFoundException('Buyer not found in the selected organization.');
    }

    return buyer;
  }
}
