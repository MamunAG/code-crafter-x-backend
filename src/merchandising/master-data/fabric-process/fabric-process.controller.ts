import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from '../../../common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { FabricProcessService } from './fabric-process.service';
import { CreateFabricProcessDto } from './dto/create-fabric-process.dto';
import { FilterFabricProcessDto } from './dto/filter-fabric-process.dto';
import { UpdateFabricProcessDto } from './dto/update-fabric-process.dto';

const FABRIC_PROCESS_MENU_NAME = 'Fabric Process Setup';

@ApiTags('Fabric Process')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/fabric-process')
export class FabricProcessController {
  constructor(
    private readonly fabricProcessService: FabricProcessService,
  ) { }

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to manage fabric process records. Please select an organization and try again.');
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(FABRIC_PROCESS_MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all items' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterFabricProcessDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...fabricProcessFilters } = filters;
    const pagination = { page, limit };
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const fabricProcesses = await this.fabricProcessService.findAll(pagination, fabricProcessFilters, selectedOrganizationId);
    return new BaseResponseDto(fabricProcesses, 'Fabric processes retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(FABRIC_PROCESS_MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific item' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const fabricProcess = await this.fabricProcessService.findOne(id, selectedOrganizationId);
    return new BaseResponseDto(fabricProcess, 'Fabric process retrieved successfully');
  }

  @Post()
  @MenuAccess(FABRIC_PROCESS_MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'save item' })
  @ApiResponse({ status: 201, description: 'Item save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Item already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateFabricProcessDto, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.created_by_id = user.userId;
    const result = await this.fabricProcessService.create(dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric process saved successfully');
  }

  @Patch(':id')
  @MenuAccess(FABRIC_PROCESS_MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'update item' })
  @ApiResponse({ status: 201, description: 'Item update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Item already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateFabricProcessDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.updated_by_id = user.userId;
    const result = await this.fabricProcessService.update(id, dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric process updated successfully');
  }

  @Delete(':id')
  @MenuAccess(FABRIC_PROCESS_MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete item' })
  @ApiResponse({ status: 200, description: 'Item delete successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.fabricProcessService.remove(id, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric process deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(FABRIC_PROCESS_MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete item permanently' })
  async permanentRemove(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.fabricProcessService.permanentRemove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric process deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(FABRIC_PROCESS_MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'restore item' })
  async restore(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.fabricProcessService.restore(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Fabric process restored successfully');
  }
}
