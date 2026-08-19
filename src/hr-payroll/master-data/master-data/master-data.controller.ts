import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { HrMasterDataType } from '../../common/hr.enums';
import { TenantPaginationDto } from '../../common/dto/tenant-pagination.dto';
import { CreateMasterDataDto } from './dto/create-master-data.dto';
import { UpdateMasterDataDto } from './dto/update-master-data.dto';
import { MasterDataService } from './master-data.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Master Data')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/master-data')
export class MasterDataController {
  constructor(private readonly service: MasterDataService) {}

  @Get() @MenuAccess('HR Master Data', 'canView')
  async list(@Headers('x-organization-id') organization?: string, @Query('type') type?: HrMasterDataType, @Query() query?: TenantPaginationDto) {
    return new BaseResponseDto(await this.service.list(organizationId(organization), type, query ?? {}), 'HR master data retrieved successfully');
  }

  @Post() @MenuAccess('HR Master Data', 'canCreate')
  async create(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateMasterDataDto) {
    return new BaseResponseDto(await this.service.create(organizationId(organization), user.userId, dto), 'HR master data created successfully');
  }

  @Get(':id') @MenuAccess('HR Master Data', 'canView')
  async findOne(@Headers('x-organization-id') organization: string, @Param('id', ParseUUIDPipe) id: string) {
    return new BaseResponseDto(await this.service.findOne(organizationId(organization), id), 'HR master data retrieved successfully');
  }

  @Patch(':id') @MenuAccess('HR Master Data', 'canUpdate')
  async update(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMasterDataDto) {
    return new BaseResponseDto(await this.service.update(organizationId(organization), user.userId, id, dto), 'HR master data updated successfully');
  }
}
