import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { UnitService } from './unit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { FilterUnitDto } from './dto/filter-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@ApiTags('Uom')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/unit')
export class UnitController {
  constructor(
    private readonly uomService: UnitService,
  ) { }

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to manage unit records. Please select an organization and try again.');
    }

    return organizationId.trim();
  }

  @Get()
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all UOMs' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterUnitDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...uomFilters } = filters;
    const pagination = { page, limit };
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const items = await this.uomService.findAll(pagination, uomFilters, selectedOrganizationId);
    return new BaseResponseDto(items, 'UOMs retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific UOM' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const item = await this.uomService.findOne(id, selectedOrganizationId);
    return new BaseResponseDto(item, 'UOM retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'save UOM' })
  @ApiResponse({ status: 201, description: 'UOM save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'UOM already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateUnitDto, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.created_by_id = user.userId;
    const result = await this.uomService.create(dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'UOM saved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'update UOM' })
  @ApiResponse({ status: 201, description: 'UOM update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'UOM already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateUnitDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.updated_by_id = user.userId;
    const result = await this.uomService.update(id, dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'UOM updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'delete UOM' })
  @ApiResponse({ status: 200, description: 'UOM delete successfully', type: BaseResponseDto })
  async remove(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.uomService.remove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'UOM deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'delete UOM permanently' })
  async permanentRemove(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.uomService.permanentRemove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'UOM deleted permanently');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'restore UOM' })
  async restore(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.uomService.restore(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'UOM restored successfully');
  }
}
