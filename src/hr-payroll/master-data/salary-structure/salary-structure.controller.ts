import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import { SalaryStructureService } from './salary-structure.service';

function organizationId(value?: string) { if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.'); return value.trim(); }

@ApiTags('HR Salary Structures') @ApiBearerAuth() @Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/compensation/salary-structures')
export class SalaryStructureController {
  constructor(private readonly service: SalaryStructureService) {}
  @Get() @MenuAccess('Compensation Setup', 'canView')
  async list(@Headers('x-organization-id') organization: string) { return new BaseResponseDto(await this.service.listStructures(organizationId(organization))); }
  @Get(':id') @MenuAccess('Compensation Setup', 'canView')
  async get(@Headers('x-organization-id') organization: string, @Param('id', ParseUUIDPipe) id: string) { return new BaseResponseDto(await this.service.getStructure(organizationId(organization), id)); }
  @Post() @MenuAccess('Compensation Setup', 'canCreate')
  async create(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateSalaryStructureDto) { return new BaseResponseDto(await this.service.createStructure(organizationId(organization), user.userId, dto), 'Salary structure created successfully'); }
  @Post(':id/activate') @MenuAccess('Compensation Setup', 'canUpdate')
  async activate(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return new BaseResponseDto(await this.service.activateStructure(organizationId(organization), user.userId, id), 'Salary structure activated successfully'); }
}
