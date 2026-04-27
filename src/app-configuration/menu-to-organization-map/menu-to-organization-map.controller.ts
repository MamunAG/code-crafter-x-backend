import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { FilterMenuToOrganizationMapDto } from './dto/filter-menu-to-organization-map.dto';
import { UpsertMenuToOrganizationMapDto } from './dto/upsert-menu-to-organization-map.dto';
import { MenuToOrganizationMapService } from './menu-to-organization-map.service';

@ApiTags('Menu To Organization Map')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/menu-to-organization-map')
export class MenuToOrganizationMapController {
  constructor(private readonly menuToOrganizationMapService: MenuToOrganizationMapService) {}

  @Get()
  @ApiOperation({ summary: 'Get menu mappings for an organization' })
  async findByOrganization(
    @CurrentUser() user: AuthUser,
    @Query() filters: FilterMenuToOrganizationMapDto,
  ) {
    const result = await this.menuToOrganizationMapService.findByOrganization(
      user,
      filters.organizationId,
    );
    return new BaseResponseDto(result, 'Organization menu mappings retrieved successfully');
  }

  @Put()
  @ApiOperation({ summary: 'Replace menu mappings for an organization' })
  async replaceForOrganization(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertMenuToOrganizationMapDto,
  ) {
    const result = await this.menuToOrganizationMapService.replaceForOrganization(user, dto);
    return new BaseResponseDto(result, 'Organization menu mappings saved successfully');
  }

  @Delete('organization/:organizationId/menu/:menuId')
  @ApiOperation({ summary: 'Remove one menu mapping from an organization' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('organizationId', new ParseUUIDPipe()) organizationId: string,
    @Param('menuId', new ParseUUIDPipe()) menuId: string,
  ) {
    const result = await this.menuToOrganizationMapService.remove(user, organizationId, menuId);
    return new BaseResponseDto(result, 'Organization menu mapping removed successfully');
  }
}
