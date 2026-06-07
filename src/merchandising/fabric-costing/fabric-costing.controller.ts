import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateFabricCostingDto } from './dto/create-fabric-costing.dto';
import { FilterFabricCostingDto } from './dto/filter-fabric-costing.dto';
import { UpdateFabricCostingDto } from './dto/update-fabric-costing.dto';
import { FabricCostingService } from './fabric-costing.service';

const MENU_NAME = 'Fabric Costing';

@ApiTags('Fabric Costing')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/fabric-costing')
export class FabricCostingController {
  constructor(private readonly fabricCostingService: FabricCostingService) {}

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to manage fabric costing records. Please select an organization and try again.');
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all fabric costing records' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterFabricCostingDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...fabricCostingFilters } = filters;
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.fabricCostingService.findAll({ page, limit }, fabricCostingFilters, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric costing records retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get fabric costing by id' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.fabricCostingService.findOne(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric costing retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'Save fabric costing' })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFabricCostingDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.fabricCostingService.create(dto, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric costing saved successfully');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Update fabric costing' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFabricCostingDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.fabricCostingService.update(id, dto, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric costing updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete fabric costing' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.fabricCostingService.remove(id, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric costing deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete fabric costing permanently' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.fabricCostingService.permanentRemove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric costing deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Restore fabric costing' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.fabricCostingService.restore(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric costing restored successfully');
  }
}
