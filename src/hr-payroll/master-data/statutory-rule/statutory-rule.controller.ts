import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateRulePackDto } from './dto/create-rule-pack.dto';
import { StatutoryRuleService } from './statutory-rule.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Statutory Rules')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/statutory-rules')
export class StatutoryRuleController {
  constructor(private readonly service: StatutoryRuleService) {}
  @Get() @MenuAccess('Statutory Rules', 'canView')
  async list(@Headers('x-organization-id') organization: string) { return new BaseResponseDto(await this.service.listRulePacks(organizationId(organization))); }
  @Post('bangladesh/default') @MenuAccess('Statutory Rules', 'canCreate')
  async seedBangladesh(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser) { return new BaseResponseDto(await this.service.seedBangladeshRules(organizationId(organization), user.userId), 'Bangladesh rule pack seeded in draft state for legal review'); }
  @Post() @MenuAccess('Statutory Rules', 'canCreate')
  async create(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateRulePackDto) { return new BaseResponseDto(await this.service.createRulePack(organizationId(organization), user.userId, dto), 'Statutory rule pack created in draft state'); }
  @Post(':id/approve') @MenuAccess('Statutory Rules', 'canUpdate')
  async approve(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return new BaseResponseDto(await this.service.approveRulePack(organizationId(organization), user.userId, id), 'Statutory rule pack approved'); }
}
