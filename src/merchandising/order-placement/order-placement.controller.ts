import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateOrderPlacementDto } from './dto/create-order-placement.dto';
import { FilterOrderPlacementDto } from './dto/filter-order-placement.dto';
import { UpdateOrderPlacementDto } from './dto/update-order-placement.dto';
import { OrderPlacementService } from './order-placement.service';

const MENU_NAME = 'Order Placement';

@ApiTags('Order Placement')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/order-placement')
export class OrderPlacementController {
  constructor(private readonly orderPlacementService: OrderPlacementService) {}

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to manage order placement records. Please select an organization and try again.');
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all order placements', description: 'Retrieve all order placement records' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterOrderPlacementDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...orderPlacementFilters } = filters;
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const records = await this.orderPlacementService.findAll({ page, limit }, orderPlacementFilters, selectedOrganizationId);
    return new BaseResponseDto(records, 'Order placements retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get order placement by id', description: 'Retrieve a specific order placement record' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const record = await this.orderPlacementService.findOne(id, selectedOrganizationId);
    return new BaseResponseDto(record, 'Order placement retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'Save order placement' })
  @ApiResponse({ status: 201, description: 'Order placement saved successfully', type: BaseResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderPlacementDto, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.orderPlacementService.create(dto, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Order placement saved successfully');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Update order placement' })
  @ApiResponse({ status: 200, description: 'Order placement updated successfully', type: BaseResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderPlacementDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.orderPlacementService.update(id, dto, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Order placement updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete order placement' })
  @ApiResponse({ status: 200, description: 'Order placement deleted successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.orderPlacementService.remove(id, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Order placement deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete order placement permanently' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.orderPlacementService.permanentRemove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Order placement deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Restore order placement' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.orderPlacementService.restore(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Order placement restored successfully');
  }
}
