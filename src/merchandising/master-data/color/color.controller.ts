import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from '../../../common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { ColorService } from './color.service';
import { CreateColorDto } from './dto/create-color.dto';
import { FilterColorDto } from './dto/filter-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

const MENU_NAME = 'Color Setup';

@ApiTags('Color')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/color')
export class ColorController {
  constructor(
    private readonly colorService: ColorService,
  ) { }

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to manage color records. Please select an organization and try again.');
    }

    return organizationId.trim();
  }

  @Get()
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all items' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterColorDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...colorFilters } = filters;
    const pagination = { page, limit };
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const colors = await this.colorService.findAll(pagination, colorFilters, selectedOrganizationId);
    return new BaseResponseDto(colors, 'Colors retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific item' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const color = await this.colorService.findOne(id, selectedOrganizationId);
    return new BaseResponseDto(color, 'Color retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'save item' })
  @ApiResponse({ status: 201, description: 'Item save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Item already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateColorDto, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.created_by_id = user.userId;
    const result = await this.colorService.create(dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'Color saved successfully');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'update item' })
  @ApiResponse({ status: 201, description: 'Item update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Item already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateColorDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.updated_by_id = user.userId;
    const result = await this.colorService.update(id, dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'Color updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete item' })
  @ApiResponse({ status: 200, description: 'Item delete successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.colorService.remove(id, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Color deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete item permanently' })
  async permanentRemove(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.colorService.permanentRemove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Color deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'restore item' })
  async restore(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.colorService.restore(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Color restored successfully');
  }
}
