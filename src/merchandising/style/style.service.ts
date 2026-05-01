import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Color } from 'src/merchandising/master-data/color/entity/color.entity';
import { Embellishment } from 'src/merchandising/master-data/embellishment/entity/embellishment.entity';
import { Size } from 'src/merchandising/master-data/size/entity/size.entity';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Files } from 'src/files/entities/file.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Style } from './entity/style.entity';
import { StyleToColorMap } from './entity/style-to-color-map.entity';
import { StyleToEmbellishmentMap } from './entity/style-to-embellishment-map.entity';
import { StyleToSizeMap } from './entity/style-to-size-map.entity';
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

    @InjectRepository(Color)
    private colorRepository: Repository<Color>,

    @InjectRepository(StyleToColorMap)
    private styleToColorMapRepository: Repository<StyleToColorMap>,

    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,

    @InjectRepository(StyleToSizeMap)
    private styleToSizeMapRepository: Repository<StyleToSizeMap>,

    @InjectRepository(Embellishment)
    private embellishmentRepository: Repository<Embellishment>,

    @InjectRepository(StyleToEmbellishmentMap)
    private styleToEmbellishmentMapRepository: Repository<StyleToEmbellishmentMap>,
  ) { }

  async create(styleDto: CreateStyleDto, organizationId: string) {
    await this.ensureStyleNoIsUnique(styleDto.styleNo, organizationId);
    const buyer = await this.findBuyerOrFail(styleDto.buyerId, organizationId);
    const currency = await this.findCurrencyOrFail(styleDto.currencyId, organizationId);
    const image = styleDto.imageId !== undefined ? await this.findFileOrFail(styleDto.imageId) : null;

    const style = this.styleRepository.create({
      ...styleDto,
      organizationId,
      buyer,
      currency,
      image: image ?? undefined,
    });

    const saved = await this.styleRepository.save(style);
    await this.syncStyleToColorMaps(saved.id, styleDto.styleToColorMaps ?? [], organizationId);
    await this.syncStyleToSizeMaps(saved.id, styleDto.styleToSizeMaps ?? [], organizationId);
    await this.syncStyleToEmbellishmentMaps(saved.id, styleDto.styleToEmbellishmentMaps ?? [], organizationId);
    return this.findOne(saved.id, organizationId);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterStyleDto>,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Style>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.styleRepository
      .createQueryBuilder('style')
      .distinct(true)
      .leftJoinAndSelect('style.buyer', 'buyer')
      .leftJoinAndSelect('style.currency', 'currency')
      .leftJoinAndSelect('style.image', 'image')
      .leftJoinAndSelect('style.styleToColorMaps', 'styleToColorMap')
      .leftJoinAndSelect('styleToColorMap.color', 'styleToColorMapColor')
      .leftJoinAndSelect('style.created_by_user', 'created_by_user')
      .leftJoinAndSelect('style.updated_by_user', 'updated_by_user')
      .where('style.organization_id = :organizationId', { organizationId })
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

  findOne(id: string, organizationId: string) {
    return this.styleRepository
      .createQueryBuilder('style')
      .leftJoinAndSelect('style.buyer', 'buyer')
      .leftJoinAndSelect('style.currency', 'currency')
      .leftJoinAndSelect('style.image', 'image')
      .leftJoinAndSelect('style.styleToColorMaps', 'styleToColorMap')
      .leftJoinAndSelect('styleToColorMap.color', 'styleToColorMapColor')
      .leftJoinAndSelect('style.styleToSizeMaps', 'styleToSizeMap')
      .leftJoinAndSelect('styleToSizeMap.size', 'styleToSizeMapSize')
      .leftJoinAndSelect('style.styleToEmbellishmentMaps', 'styleToEmbellishmentMap')
      .leftJoinAndSelect('styleToEmbellishmentMap.embellishment', 'styleToEmbellishmentMapEmbellishment')
      .leftJoinAndSelect('style.created_by_user', 'created_by_user')
      .leftJoinAndSelect('style.updated_by_user', 'updated_by_user')
      .where('style.organization_id = :organizationId', { organizationId })
      .andWhere('style.id = :id', { id })
      .andWhere('style.deleted_at IS NULL')
      .getOne()
      .then((style) => {
        if (!style) {
          throw new NotFoundException('Style not found in the selected organization.');
        }

        return style;
      });
  }

  async update(id: string, dto: UpdateStyleDto, organizationId: string) {
    if (dto.styleNo) {
      await this.ensureStyleNoIsUnique(dto.styleNo, organizationId, id);
    }
    const style = await this.styleRepository.findOne({
      where: { id, organizationId },
      relations: ['buyer', 'currency', 'image'],
      withDeleted: false,
    });

    if (!style) {
      throw new BadRequestException('Style not found');
    }

    if (dto.buyerId !== undefined) {
      style.buyer = await this.findBuyerOrFail(dto.buyerId, organizationId);
    }

    if (dto.currencyId !== undefined) {
      style.currency = await this.findCurrencyOrFail(dto.currencyId, organizationId);
    }

    if (dto.imageId !== undefined) {
      style.image = await this.findFileOrFail(dto.imageId);
    }

    Object.assign(style, dto);
    const saved = await this.styleRepository.save(style);
    if (dto.styleToColorMaps !== undefined) {
      await this.syncStyleToColorMaps(saved.id, dto.styleToColorMaps, organizationId);
    }
    if (dto.styleToSizeMaps !== undefined) {
      await this.syncStyleToSizeMaps(saved.id, dto.styleToSizeMaps, organizationId);
    }
    if (dto.styleToEmbellishmentMaps !== undefined) {
      await this.syncStyleToEmbellishmentMaps(saved.id, dto.styleToEmbellishmentMaps, organizationId);
    }
    return this.findOne(saved.id, organizationId);
  }

  async remove(id: string, organizationId: string) {
    await this.ensureStyleExists(id, organizationId);
    return this.styleRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: string, organizationId: string) {
    await this.ensureStyleExists(id, organizationId, true);
    return this.styleRepository.delete({ id, organizationId });
  }

  async restore(id: string, organizationId: string) {
    await this.ensureStyleExists(id, organizationId, true);
    return this.styleRepository.restore({ id, organizationId });
  }

  private async ensureStyleNoIsUnique(styleNo: string, organizationId: string, ignoreId?: string) {
    const normalizedStyleNo = styleNo.trim().toLowerCase();

    const queryBuilder = this.styleRepository
      .createQueryBuilder('style')
      .where('LOWER(TRIM(style.styleNo)) = :styleNo', {
        styleNo: normalizedStyleNo,
      })
      .andWhere('style.organization_id = :organizationId', { organizationId })
      .andWhere('style.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('style.id != :ignoreId', { ignoreId });
    }

    const existingStyle = await queryBuilder.getOne();

    if (existingStyle) {
      throw new BadRequestException('Style already exists');
    }
  }

  private async findBuyerOrFail(buyerId: string, organizationId: string) {
    const buyer = await this.buyerRepository.findOne({
      where: { id: buyerId, organizationId },
    });

    if (!buyer) {
      throw new BadRequestException('Buyer not found in the selected organization.');
    }

    return buyer;
  }

  private async findCurrencyOrFail(currencyId: number, organizationId: string) {
    const currency = await this.currencyRepository.findOne({
      where: { id: currencyId, organizationId },
    });

    if (!currency) {
      throw new BadRequestException('Currency not found in the selected organization.');
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

  private async syncStyleToColorMaps(styleId: string, styleToColorMaps: CreateStyleDto['styleToColorMaps'], organizationId: string) {
    await this.styleToColorMapRepository.softDelete({
      styleId,
    });

    if (!styleToColorMaps?.length) {
      return;
    }

    const records: StyleToColorMap[] = [];
    for (const item of styleToColorMaps) {
      const color = await this.findColorOrFail(item.colorId, organizationId);
      records.push(
        this.styleToColorMapRepository.create({
          styleId,
          colorId: color.id,
        }),
      );
    }

    await this.styleToColorMapRepository.save(records);
  }

  private async syncStyleToSizeMaps(styleId: string, styleToSizeMaps: CreateStyleDto['styleToSizeMaps'], organizationId: string) {
    await this.styleToSizeMapRepository.softDelete({
      styleId,
    });

    if (!styleToSizeMaps?.length) {
      return;
    }

    const records: StyleToSizeMap[] = [];
    for (const item of styleToSizeMaps) {
      const size = await this.findSizeOrFail(item.sizeId, organizationId);
      records.push(
        this.styleToSizeMapRepository.create({
          styleId,
          sizeId: size.id,
        }),
      );
    }

    await this.styleToSizeMapRepository.save(records);
  }

  private async syncStyleToEmbellishmentMaps(styleId: string, styleToEmbellishmentMaps: CreateStyleDto['styleToEmbellishmentMaps'], organizationId: string) {
    await this.styleToEmbellishmentMapRepository.softDelete({
      styleId,
    });

    if (!styleToEmbellishmentMaps?.length) {
      return;
    }

    const records: StyleToEmbellishmentMap[] = [];
    for (const item of styleToEmbellishmentMaps) {
      const embellishment = await this.findEmbellishmentOrFail(item.embellishmentId, organizationId);
      records.push(
        this.styleToEmbellishmentMapRepository.create({
          styleId,
          embellishmentId: embellishment.id,
        }),
      );
    }

    await this.styleToEmbellishmentMapRepository.save(records);
  }

  private async findColorOrFail(colorId: number, organizationId: string) {
    const color = await this.colorRepository.findOne({
      where: { id: colorId, organizationId },
    });

    if (!color) {
      throw new BadRequestException('Color not found in the selected organization.');
    }

    return color;
  }

  private async findSizeOrFail(sizeId: number, organizationId: string) {
    const size = await this.sizeRepository.findOne({
      where: { id: sizeId, organizationId },
    });

    if (!size) {
      throw new BadRequestException('Size not found in the selected organization.');
    }

    return size;
  }

  private async findEmbellishmentOrFail(embellishmentId: number, organizationId: string) {
    const embellishment = await this.embellishmentRepository.findOne({
      where: { id: embellishmentId, organizationId },
    });

    if (!embellishment) {
      throw new BadRequestException('Embellishment not found in the selected organization.');
    }

    return embellishment;
  }

  private async ensureStyleExists(id: string, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.styleRepository
      .createQueryBuilder('style')
      .where('style.id = :id', { id })
      .andWhere('style.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('style.deleted_at IS NULL');
    }

    const style = await queryBuilder.getOne();

    if (!style) {
      throw new NotFoundException('Style not found in the selected organization.');
    }

    return style;
  }
}

