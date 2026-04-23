import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Files } from 'src/files/entities/file.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Style } from './entity/style.entity';
import { CreateStyleDto } from './dto/create-style.dto';
import { FilterStyleDto } from './dto/filter-style.dto';
import { UpdateStyleDto } from './dto/update-style.dto';

@Injectable()
export class StyleService {
  constructor(
    @InjectRepository(Style)
    private styleRepository: Repository<Style>,

    @InjectRepository(Buyer)
    private buyerRepository: Repository<Buyer>,

    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,

    @InjectRepository(Files)
    private filesRepository: Repository<Files>,
  ) { }

  async create(styleDto: CreateStyleDto) {
    await this.ensureStyleNoIsUnique(styleDto.styleNo);
    const buyer = await this.findBuyerOrFail(styleDto.buyerId);
    const currency = await this.findCurrencyOrFail(styleDto.currencyId);
    const image = styleDto.imageId !== undefined ? await this.findFileOrFail(styleDto.imageId) : null;

    const style = this.styleRepository.create({
      ...styleDto,
      buyer,
      currency,
      image: image ?? undefined,
    });

    const saved = await this.styleRepository.save(style);
    return this.findOne(saved.id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterStyleDto>,
  ): Promise<PaginatedResponseDto<Style>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.styleRepository
      .createQueryBuilder('style')
      .leftJoinAndSelect('style.buyer', 'buyer')
      .leftJoinAndSelect('style.currency', 'currency')
      .leftJoinAndSelect('style.image', 'image')
      .leftJoinAndSelect('style.created_by_user', 'created_by_user')
      .leftJoinAndSelect('style.updated_by_user', 'updated_by_user')
      .skip(skip)
      .take(limit)
      .orderBy('style.created_at', 'DESC');

    if (filters?.productType) {
      queryBuilder.andWhere('style.productType ILIKE :productType', {
        productType: `%${filters.productType}%`,
      });
    }

    if (filters?.buyerId) {
      queryBuilder.andWhere('buyer.id = :buyerId', {
        buyerId: filters.buyerId,
      });
    }

    if (filters?.styleNo) {
      queryBuilder.andWhere('style.styleNo ILIKE :styleNo', {
        styleNo: `%${filters.styleNo}%`,
      });
    }

    if (filters?.styleName) {
      queryBuilder.andWhere('style.styleName ILIKE :styleName', {
        styleName: `%${filters.styleName}%`,
      });
    }

    if (filters?.currencyId !== undefined) {
      queryBuilder.andWhere('currency.id = :currencyId', {
        currencyId: filters.currencyId,
      });
    }

    if (filters?.imageId !== undefined) {
      queryBuilder.andWhere('image.id = :imageId', {
        imageId: filters.imageId,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('style.isActive = :isActive', {
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

  findOne(id: number) {
    return this.styleRepository
      .createQueryBuilder('style')
      .leftJoinAndSelect('style.buyer', 'buyer')
      .leftJoinAndSelect('style.currency', 'currency')
      .leftJoinAndSelect('style.image', 'image')
      .leftJoinAndSelect('style.created_by_user', 'created_by_user')
      .leftJoinAndSelect('style.updated_by_user', 'updated_by_user')
      .where('style.id = :id', { id })
      .andWhere('style.deleted_at IS NULL')
      .getOne();
  }

  async update(id: number, dto: UpdateStyleDto) {
    if (dto.styleNo) {
      await this.ensureStyleNoIsUnique(dto.styleNo, id);
    }
    const style = await this.styleRepository.findOne({
      where: { id },
      relations: ['buyer', 'currency', 'image'],
      withDeleted: false,
    });

    if (!style) {
      throw new BadRequestException('Style not found');
    }

    if (dto.buyerId !== undefined) {
      style.buyer = await this.findBuyerOrFail(dto.buyerId);
    }

    if (dto.currencyId !== undefined) {
      style.currency = await this.findCurrencyOrFail(dto.currencyId);
    }

    if (dto.imageId !== undefined) {
      style.image = await this.findFileOrFail(dto.imageId);
    }

    Object.assign(style, dto);
    const saved = await this.styleRepository.save(style);
    return this.findOne(saved.id);
  }

  remove(id: number) {
    return this.styleRepository.softDelete(id);
  }

  permanentRemove(id: number) {
    return this.styleRepository.delete(id);
  }

  restore(id: number) {
    return this.styleRepository.restore(id);
  }

  private async ensureStyleNoIsUnique(styleNo: string, ignoreId?: number) {
    const normalizedStyleNo = styleNo.trim().toLowerCase();

    const queryBuilder = this.styleRepository
      .createQueryBuilder('style')
      .where('LOWER(TRIM(style.styleNo)) = :styleNo', {
        styleNo: normalizedStyleNo,
      })
      .andWhere('style.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('style.id != :ignoreId', { ignoreId });
    }

    const existingStyle = await queryBuilder.getOne();

    if (existingStyle) {
      throw new BadRequestException('Style already exists');
    }
  }

  private async findBuyerOrFail(buyerId: string) {
    const buyer = await this.buyerRepository.findOne({
      where: { id: buyerId },
    });

    if (!buyer) {
      throw new BadRequestException('Buyer not found');
    }

    return buyer;
  }

  private async findCurrencyOrFail(currencyId: number) {
    const currency = await this.currencyRepository.findOne({
      where: { id: currencyId },
    });

    if (!currency) {
      throw new BadRequestException('Currency not found');
    }

    return currency;
  }

  private async findFileOrFail(fileId: number) {
    const file = await this.filesRepository.findOne({
      where: { id: fileId },
    });

    if (!file) {
      throw new BadRequestException('Image not found');
    }

    return file;
  }
}
