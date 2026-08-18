import { BadRequestException, Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateShiftDto } from './dto/create-shift.dto';
import { ShiftService } from './shift.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Shifts') @ApiBearerAuth() @Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/shifts')
export class ShiftController {
  constructor(private readonly service: ShiftService) {}
  @Get() @MenuAccess('Shift Setup', 'canView')
  async list(@Headers('x-organization-id') organization: string) { return new BaseResponseDto(await this.service.listShifts(organizationId(organization))); }
  @Post() @MenuAccess('Shift Setup', 'canCreate')
  async create(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateShiftDto) { return new BaseResponseDto(await this.service.createShift(organizationId(organization), user.userId, dto), 'Shift created successfully'); }
}
