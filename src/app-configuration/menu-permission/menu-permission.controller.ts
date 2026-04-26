import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { FilterMenuPermissionDto } from './dto/filter-menu-permission.dto';
import { UpsertMenuPermissionDto } from './dto/upsert-menu-permission.dto';
import { MenuPermissionService } from './menu-permission.service';

@ApiTags('Menu Permission')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/menu-permission')
export class MenuPermissionController {
  constructor(private readonly menuPermissionService: MenuPermissionService) {}

  @Get()
  @ApiOperation({ summary: 'Get menu permissions for an organization admin' })
  async findAll(@CurrentUser() user: AuthUser, @Query() filters: FilterMenuPermissionDto) {
    const result = await this.menuPermissionService.findAll(user.userId, filters);
    return new BaseResponseDto(result, 'Menu permissions retrieved successfully');
  }

  @Put()
  @ApiOperation({ summary: 'Create or update user menu permissions' })
  async upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertMenuPermissionDto) {
    const result = await this.menuPermissionService.upsert(user.userId, dto);
    return new BaseResponseDto(result, 'Menu permissions saved successfully');
  }
}
