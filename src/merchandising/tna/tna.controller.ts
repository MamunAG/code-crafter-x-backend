import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateTnaDto } from './dto/create-tna.dto';
import { FilterTnaDto } from './dto/filter-tna.dto';
import { UpdateTnaDto } from './dto/update-tna.dto';
import { TnaService } from './tna.service';

const MENU_NAME = 'TNA';

@ApiTags('TNA')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/tna')
export class TnaController {
  constructor(private readonly tnaService: TnaService) {}

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to manage TNA records. Please select an organization and try again.');
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all TNA records', description: 'Retrieve all TNA master records' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterTnaDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...tnaFilters } = filters;
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const records = await this.tnaService.findAll({ page, limit }, tnaFilters, selectedOrganizationId);
    return new BaseResponseDto(records, 'TNA records retrieved successfully');
  }

  @Get('report')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get TNA report', description: 'Retrieve TNA records formatted for report views' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async report(@Query() filters: FilterTnaDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, deletedOnly, ...tnaFilters } = filters;
    void page;
    void limit;
    void deletedOnly;
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const records = await this.tnaService.findReport(tnaFilters, selectedOrganizationId);
    return new BaseResponseDto(records, 'TNA report retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get TNA by id', description: 'Retrieve a specific TNA record' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const record = await this.tnaService.findOne(id, selectedOrganizationId);
    return new BaseResponseDto(record, 'TNA record retrieved successfully');
  }

  @Get(':id/details/:detailId/revisions')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get TNA detail revision history', description: 'Retrieve execution-date revision history for a TNA detail row' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findDetailRevisions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('detailId', new ParseUUIDPipe()) detailId: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const records = await this.tnaService.findDetailRevisions(id, detailId, selectedOrganizationId);
    return new BaseResponseDto(records, 'TNA detail revisions retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'Save TNA' })
  @ApiResponse({ status: 201, description: 'TNA saved successfully', type: BaseResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateTnaDto, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.tnaService.create(dto, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'TNA saved successfully');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Update TNA' })
  @ApiResponse({ status: 200, description: 'TNA updated successfully', type: BaseResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTnaDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.tnaService.update(id, dto, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'TNA updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete TNA' })
  @ApiResponse({ status: 200, description: 'TNA deleted successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.tnaService.remove(id, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'TNA deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete TNA permanently' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.tnaService.permanentRemove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'TNA deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Restore TNA' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.tnaService.restore(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'TNA restored successfully');
  }
}
