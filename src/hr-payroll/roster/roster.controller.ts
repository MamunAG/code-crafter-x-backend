import { BadRequestException, Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateRosterDto } from './dto/create-roster.dto';
import { RosterService } from './roster.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Rosters') @ApiBearerAuth() @Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/rosters')
export class RosterController {
  constructor(private readonly service: RosterService) {}
  @Post() @MenuAccess('Roster Management', 'canCreate')
  async create(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateRosterDto) { return new BaseResponseDto(await this.service.assignRoster(organizationId(organization), user.userId, dto), 'Roster assigned successfully'); }
}
