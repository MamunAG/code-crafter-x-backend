import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Material } from 'src/app-configuration/material/entity/material.entity';
import { Unit } from 'src/app-configuration/unit/entity/unit.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FabricProcess } from 'src/merchandising/master-data/fabric-process/entity/fabric-process.entity';
import { GmtCostScope } from 'src/merchandising/master-data/gmt-cost-scope/entity/gmt-cost-scope.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateFabricCostingDto } from './dto/create-fabric-costing.dto';
import { CreateFabricCostingYarnProcessDto } from './dto/create-fabric-costing-yarn-process.dto';
import { FilterFabricCostingDto } from './dto/filter-fabric-costing.dto';
import { UpdateFabricCostingDto } from './dto/update-fabric-costing.dto';
import { FabricCostingCommonProcess } from './entity/fabric-costing-common-process.entity';
import { FabricCostingYarnProcess } from './entity/fabric-costing-yarn-process.entity';
import { FabricCostingYarn } from './entity/fabric-costing-yarn.entity';
import { FabricCosting } from './entity/fabric-costing.entity';
import { FabricCostingYarnAdditionalCost } from './entity/fabric-costing-yarn-additional-cost.entity';
import { CreateFabricCostingYarnAdditionalCostDto } from './dto/create-fabric-costing-yarn-additional-cost.dto';

type FabricCostingListFilters = Partial<FilterFabricCostingDto> & {
  deletedOnly?: string | boolean;
};

@Injectable()
export class FabricCostingService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(FabricCosting)
    private readonly fabricCostingRepository: Repository<FabricCosting>,

    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,

    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>,

    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,

    @InjectRepository(FabricProcess)
    private readonly fabricProcessRepository: Repository<FabricProcess>,

    @InjectRepository(GmtCostScope)
    private readonly gmtCostScopeRepository: Repository<GmtCostScope>,
  ) {}

  async create(dto: CreateFabricCostingDto, userId: string, organizationId: string) {
    await this.validateHeader(dto, organizationId);
    await this.validateChildren(dto, organizationId);

    const id = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(FabricCosting);
      const fabricCosting = repository.create({
        fabricId: this.optionalUuid(dto.fabricId),
        qty: this.numberOrDefault(dto.qty, 1),
        finishedFabricCost: this.numberOrDefault(dto.finishedFabricCost, 0),
        unitId: dto.unitId ?? null,
        currencyId: dto.currencyId,
        costName: this.optionalString(dto.costName),
        organizationId,
        created_by_id: userId,
        updated_by_id: null as unknown as string,
        updated_at: null as unknown as Date,
      });

      const saved = await repository.save(fabricCosting);
      await this.syncChildren(saved.id, dto, userId, manager);
      return saved.id;
    });

    return this.findOne(id, organizationId);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: FabricCostingListFilters,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<FabricCosting>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;
    const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';

    const queryBuilder = this.fabricCostingRepository
      .createQueryBuilder('fabricCosting')
      .distinct(true)
      .leftJoinAndSelect('fabricCosting.fabric', 'fabric')
      .leftJoinAndSelect('fabricCosting.unit', 'unit')
      .leftJoinAndSelect('fabricCosting.currency', 'currency')
      .leftJoinAndSelect('fabricCosting.yarns', 'yarn')
      .leftJoinAndSelect('yarn.yarn', 'yarnMaterial')
      .leftJoinAndSelect('yarn.yarnWiseProcesses', 'yarnProcess')
      .leftJoinAndSelect('yarnProcess.process', 'yarnFabricProcess')
      .leftJoinAndSelect('yarn.additionalMaterialCosts', 'yarnAdditionalCost')
      .leftJoinAndSelect('yarnAdditionalCost.gmtCostScope', 'yarnGmtCostScope')
      .leftJoinAndSelect('fabricCosting.commonProcesses', 'commonProcess')
      .leftJoinAndSelect('commonProcess.process', 'commonFabricProcess')
      .leftJoinAndSelect('fabricCosting.created_by_user', 'created_by_user')
      .leftJoinAndSelect('fabricCosting.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('fabricCosting.deleted_by_user', 'deleted_by_user')
      .where('fabricCosting.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'fabricCosting.deleted_at' : 'fabricCosting.created_at', 'DESC')
      .addOrderBy('yarn.created_at', 'ASC')
      .addOrderBy('yarnProcess.created_at', 'ASC')
      .addOrderBy('yarnAdditionalCost.created_at', 'ASC')
      .addOrderBy('commonProcess.created_at', 'ASC');

    if (deletedOnly) {
      queryBuilder.withDeleted().andWhere('fabricCosting.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('fabricCosting.deleted_at IS NULL');
    }

    if (filters?.fabricId) {
      queryBuilder.andWhere('fabricCosting.fabric_id = :fabricId', { fabricId: filters.fabricId });
    }

    if (filters?.currencyId !== undefined) {
      queryBuilder.andWhere('fabricCosting.currency_id = :currencyId', { currencyId: filters.currencyId });
    }

    if (filters?.unitId !== undefined) {
      queryBuilder.andWhere('fabricCosting.unit_id = :unitId', { unitId: filters.unitId });
    }

    if (filters?.costName) {
      queryBuilder.andWhere('fabricCosting.cost_name ILIKE :costName', {
        costName: `%${filters.costName.trim()}%`,
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

  async findOne(id: string, organizationId: string) {
    const fabricCosting = await this.fabricCostingRepository
      .createQueryBuilder('fabricCosting')
      .leftJoinAndSelect('fabricCosting.fabric', 'fabric')
      .leftJoinAndSelect('fabricCosting.unit', 'unit')
      .leftJoinAndSelect('fabricCosting.currency', 'currency')
      .leftJoinAndSelect('fabricCosting.yarns', 'yarn')
      .leftJoinAndSelect('yarn.yarn', 'yarnMaterial')
      .leftJoinAndSelect('yarn.yarnWiseProcesses', 'yarnProcess')
      .leftJoinAndSelect('yarnProcess.process', 'yarnFabricProcess')
      .leftJoinAndSelect('yarn.additionalMaterialCosts', 'yarnAdditionalCost')
      .leftJoinAndSelect('yarnAdditionalCost.gmtCostScope', 'yarnGmtCostScope')
      .leftJoinAndSelect('fabricCosting.commonProcesses', 'commonProcess')
      .leftJoinAndSelect('commonProcess.process', 'commonFabricProcess')
      .leftJoinAndSelect('fabricCosting.created_by_user', 'created_by_user')
      .leftJoinAndSelect('fabricCosting.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('fabricCosting.deleted_by_user', 'deleted_by_user')
      .where('fabricCosting.id = :id', { id })
      .andWhere('fabricCosting.organization_id = :organizationId', { organizationId })
      .andWhere('fabricCosting.deleted_at IS NULL')
      .orderBy('yarn.created_at', 'ASC')
      .addOrderBy('yarnProcess.created_at', 'ASC')
      .addOrderBy('yarnAdditionalCost.created_at', 'ASC')
      .addOrderBy('commonProcess.created_at', 'ASC')
      .getOne();

    if (!fabricCosting) {
      throw new NotFoundException('Fabric costing not found in the selected organization.');
    }

    return this.normalizeUpdatedAt(fabricCosting);
  }

  async update(id: string, dto: UpdateFabricCostingDto, userId: string, organizationId: string) {
    await this.ensureFabricCostingExists(id, organizationId);
    await this.validateHeader(dto, organizationId);
    await this.validateChildren(dto, organizationId);

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(FabricCosting);
      const fabricCosting = await repository.findOne({
        where: { id, organizationId },
        withDeleted: false,
      });

      if (!fabricCosting) {
        throw new NotFoundException('Fabric costing not found in the selected organization.');
      }

      Object.assign(fabricCosting, {
        ...(dto.fabricId !== undefined ? { fabricId: this.optionalUuid(dto.fabricId) } : {}),
        ...(dto.qty !== undefined ? { qty: this.numberOrDefault(dto.qty, 1) } : {}),
        ...(dto.finishedFabricCost !== undefined
          ? { finishedFabricCost: this.numberOrDefault(dto.finishedFabricCost, 0) }
          : {}),
        ...(dto.unitId !== undefined ? { unitId: dto.unitId ?? null } : {}),
        ...(dto.currencyId !== undefined ? { currencyId: dto.currencyId } : {}),
        ...(dto.costName !== undefined ? { costName: this.optionalString(dto.costName) } : {}),
        updated_by_id: userId,
        updated_at: new Date(),
      });

      await repository.save(fabricCosting);

      if (dto.yarns !== undefined || dto.commonProcesses !== undefined) {
        await this.syncChildren(id, dto, userId, manager);
      }
    });

    return this.findOne(id, organizationId);
  }

  async remove(id: string, deletedById: string, organizationId: string) {
    await this.ensureFabricCostingExists(id, organizationId);
    await this.fabricCostingRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
    return this.fabricCostingRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: string, organizationId: string) {
    await this.ensureFabricCostingExists(id, organizationId, true);
    return this.fabricCostingRepository.delete({ id, organizationId });
  }

  async restore(id: string, organizationId: string) {
    await this.ensureFabricCostingExists(id, organizationId, true);
    return this.fabricCostingRepository.restore({ id, organizationId });
  }

  private async syncChildren(
    fabricCostingId: string,
    dto: Partial<CreateFabricCostingDto>,
    userId: string,
    manager: EntityManager,
  ) {
    if (dto.yarns !== undefined) {
      const yarnRepository = manager.getRepository(FabricCostingYarn);
      const yarnProcessRepository = manager.getRepository(FabricCostingYarnProcess);
      const yarnAdditionalCostRepository = manager.getRepository(FabricCostingYarnAdditionalCost);
      const existingYarns = await yarnRepository.find({ where: { fabricCostingId } });
      const existingYarnIds = existingYarns.map((yarn) => yarn.id);

      if (existingYarnIds.length) {
        await yarnProcessRepository
          .createQueryBuilder()
          .delete()
          .where('fabric_costing_yarn_id IN (:...ids)', { ids: existingYarnIds })
          .execute();
        await yarnAdditionalCostRepository
          .createQueryBuilder()
          .delete()
          .where('fabric_costing_yarn_id IN (:...ids)', { ids: existingYarnIds })
          .execute();
      }

      await yarnRepository.delete({ fabricCostingId });

      for (const yarnDto of dto.yarns ?? []) {
        const yarn = yarnRepository.create({
          fabricCostingId,
          yarnId: this.optionalUuid(yarnDto.yarnId),
          percentagePerUnitFabric: this.numberOrDefault(yarnDto.percentagePerUnitFabric, 0),
          yarnPricePerUnit: this.numberOrDefault(yarnDto.yarnPricePerUnit, 0),
          totalYarnPrice: this.numberOrDefault(yarnDto.totalYarnPrice, 0),
          created_by_id: userId,
        });
        const savedYarn = await yarnRepository.save(yarn);
        await this.createYarnProcesses(savedYarn.id, yarnDto.yarnWiseProcesses ?? [], userId, manager);
        await this.createYarnAdditionalCosts(savedYarn.id, yarnDto.additionalMaterialCosts ?? [], userId, manager);
      }
    }

    if (dto.commonProcesses !== undefined) {
      const commonProcessRepository = manager.getRepository(FabricCostingCommonProcess);
      await commonProcessRepository.delete({ fabricCostingId });

      const records = (dto.commonProcesses ?? []).map((processDto) =>
        commonProcessRepository.create({
          fabricCostingId,
          processId: processDto.processId ?? null,
          ratePerUnitFabric: this.numberOrDefault(processDto.ratePerUnitFabric, 0),
          wastagePercentage: this.numberOrDefault(processDto.wastagePercentage, 0),
          created_by_id: userId,
        }),
      );

      if (records.length) {
        await commonProcessRepository.save(records);
      }
    }
  }

  private async createYarnProcesses(
    fabricCostingYarnId: string,
    yarnProcesses: CreateFabricCostingYarnProcessDto[],
    userId: string,
    manager: EntityManager,
  ) {
    const repository = manager.getRepository(FabricCostingYarnProcess);
    const records = yarnProcesses.map((processDto) =>
      repository.create({
        fabricCostingYarnId,
        processId: processDto.processId ?? null,
        rateUnitFabric: this.numberOrDefault(processDto.rateUnitFabric, 0),
        wastagePercentage: this.numberOrDefault(processDto.wastagePercentage, 0),
        created_by_id: userId,
      }),
    );

    if (records.length) {
      await repository.save(records);
    }
  }

  private async createYarnAdditionalCosts(
    fabricCostingYarnId: string,
    additionalCosts: CreateFabricCostingYarnAdditionalCostDto[],
    userId: string,
    manager: EntityManager,
  ) {
    const repository = manager.getRepository(FabricCostingYarnAdditionalCost);
    const records = additionalCosts.map((additionalCostDto) =>
      repository.create({
        fabricCostingYarnId,
        gmtCostScopeId: additionalCostDto.gmtCostScopeId,
        percentage: this.numberOrDefault(additionalCostDto.percentage, 0),
        directCost: this.numberOrDefault(additionalCostDto.directCost, 0),
        created_by_id: userId,
      }),
    );
    if (records.length) await repository.save(records);
  }

  private async validateHeader(dto: Partial<CreateFabricCostingDto>, organizationId: string) {
    if (dto.fabricId !== undefined && dto.fabricId) {
      await this.findMaterialOrFail(dto.fabricId, organizationId, 'Fabric');
    }

    if (dto.unitId !== undefined && dto.unitId !== null) {
      await this.findUnitOrFail(dto.unitId, organizationId);
    }

    if (dto.currencyId !== undefined) {
      await this.findCurrencyOrFail(dto.currencyId, organizationId);
    }
  }

  private async validateChildren(dto: Partial<CreateFabricCostingDto>, organizationId: string) {
    for (const yarn of dto.yarns ?? []) {
      if (yarn.yarnId) {
        await this.findMaterialOrFail(yarn.yarnId, organizationId, 'Yarn');
      }

      for (const process of yarn.yarnWiseProcesses ?? []) {
        await this.findFabricProcessOrFail(process.processId, organizationId);
      }

      const scopeIds = new Set<number>();
      for (const additionalCost of yarn.additionalMaterialCosts ?? []) {
        await this.findGmtCostScopeOrFail(additionalCost.gmtCostScopeId, organizationId);
        if (scopeIds.has(additionalCost.gmtCostScopeId)) {
          throw new BadRequestException('Each GMT cost scope can only be added once per material.');
        }
        scopeIds.add(additionalCost.gmtCostScopeId);
        const percentage = this.numberOrDefault(additionalCost.percentage, 0);
        const directCost = this.numberOrDefault(additionalCost.directCost, 0);
        if (percentage < 0 || percentage > 100) {
          throw new BadRequestException('Additional material cost percentage must be between 0 and 100.');
        }
        if (directCost < 0) {
          throw new BadRequestException('Additional material direct cost cannot be negative.');
        }
        if ((percentage > 0) === (directCost > 0)) {
          throw new BadRequestException('Enter either a percentage or a direct cost for each additional material cost.');
        }
      }
    }

    for (const process of dto.commonProcesses ?? []) {
      await this.findFabricProcessOrFail(process.processId, organizationId);
    }
  }

  private async findMaterialOrFail(id: string, organizationId: string, label: string) {
    const material = await this.materialRepository.findOne({ where: { id, organizationId } });
    if (!material) throw new BadRequestException(`${label} material not found in the selected organization.`);
    return material;
  }

  private async findUnitOrFail(id: number, organizationId: string) {
    const unit = await this.unitRepository.findOne({ where: { id, organizationId } });
    if (!unit) throw new BadRequestException('Unit not found in the selected organization.');
    return unit;
  }

  private async findCurrencyOrFail(id: number, organizationId: string) {
    const currency = await this.currencyRepository.findOne({ where: { id, organizationId } });
    if (!currency) throw new BadRequestException('Currency not found in the selected organization.');
    return currency;
  }

  private async findFabricProcessOrFail(id: number | null | undefined, organizationId: string) {
    if (id == null) return null;
    const process = await this.fabricProcessRepository.findOne({ where: { id, organizationId } });
    if (!process) throw new BadRequestException('Fabric process not found in the selected organization.');
    return process;
  }

  private async findGmtCostScopeOrFail(id: number, organizationId: string) {
    const scope = await this.gmtCostScopeRepository.findOne({ where: { id, organizationId } });
    if (!scope) throw new BadRequestException('GMT cost scope not found in the selected organization.');
    return scope;
  }

  private async ensureFabricCostingExists(id: string, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.fabricCostingRepository
      .createQueryBuilder('fabricCosting')
      .where('fabricCosting.id = :id', { id })
      .andWhere('fabricCosting.organization_id = :organizationId', { organizationId });

    if (includeDeleted) queryBuilder.withDeleted();
    else queryBuilder.andWhere('fabricCosting.deleted_at IS NULL');

    const fabricCosting = await queryBuilder.getOne();
    if (!fabricCosting) throw new NotFoundException('Fabric costing not found in the selected organization.');
    return fabricCosting;
  }

  private optionalString(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || null;
  }

  private optionalUuid(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || null;
  }

  private numberOrDefault(value: unknown, fallback: number) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  private normalizeUpdatedAt<T extends { updated_at?: Date | null; updated_by_id?: string | null; updated_by_user?: unknown } | null>(
    value: T,
  ): T {
    if (!value) return value;
    if (!value.updated_by_id && !value.updated_by_user) value.updated_at = null;
    return value;
  }

  private normalizeUpdatedAtList<T extends { updated_at?: Date | null; updated_by_id?: string | null; updated_by_user?: unknown }>(
    values: T[],
  ): T[] {
    return values.map((value) => this.normalizeUpdatedAt(value));
  }
}
