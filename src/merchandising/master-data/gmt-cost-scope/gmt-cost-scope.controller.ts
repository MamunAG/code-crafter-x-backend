import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateGmtCostScopeDto } from './dto/create-gmt-cost-scope.dto';
import { FilterGmtCostScopeDto } from './dto/filter-gmt-cost-scope.dto';
import { UpdateGmtCostScopeDto } from './dto/update-gmt-cost-scope.dto';
import { GmtCostScopeService } from './gmt-cost-scope.service';

const MENU_NAME = 'GMT Cost Scope Setup';

@ApiTags('GMT Cost Scope')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/gmt-cost-scope')
export class GmtCostScopeController {
  constructor(private readonly service: GmtCostScopeService) {}

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) throw new BadRequestException('An organization is required to manage GMT cost scopes.');
    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all GMT cost scopes' })
  async findAll(@Query() filters: FilterGmtCostScopeDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...scopeFilters } = filters;
    return new BaseResponseDto(
      await this.service.findAll({ page, limit }, scopeFilters, this.requireOrganizationId(organizationId)),
      'GMT cost scopes retrieved successfully',
    );
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  async findOne(@Param('id', ParseIntPipe) id: number, @Headers('x-organization-id') organizationId?: string) {
    return new BaseResponseDto(await this.service.findOne(id, this.requireOrganizationId(organizationId)), 'GMT cost scope retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateGmtCostScopeDto, @Headers('x-organization-id') organizationId?: string) {
    return new BaseResponseDto(await this.service.create(dto, user.userId, this.requireOrganizationId(organizationId)), 'GMT cost scope saved successfully');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  async update(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGmtCostScopeDto, @Headers('x-organization-id') organizationId?: string) {
    return new BaseResponseDto(await this.service.update(id, dto, user.userId, this.requireOrganizationId(organizationId)), 'GMT cost scope updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Headers('x-organization-id') organizationId?: string) {
    return new BaseResponseDto(await this.service.remove(id, user.userId, this.requireOrganizationId(organizationId)), 'GMT cost scope deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  async permanentRemove(@Param('id', ParseIntPipe) id: number, @Headers('x-organization-id') organizationId?: string) {
    return new BaseResponseDto(await this.service.permanentRemove(id, this.requireOrganizationId(organizationId)), 'GMT cost scope deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  async restore(@Param('id', ParseIntPipe) id: number, @Headers('x-organization-id') organizationId?: string) {
    return new BaseResponseDto(await this.service.restore(id, this.requireOrganizationId(organizationId)), 'GMT cost scope restored successfully');
  }
}
