import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { TenantPaginationDto } from '../common/dto/tenant-pagination.dto';
import { CancelLeaveDto } from './dto/cancel-leave.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { LeaveDecisionDto } from './dto/leave-decision.dto';
import { LeaveService } from './leave.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Leave')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/leave')
export class LeaveController {
  constructor(private readonly workforce: LeaveService) {}
  @Get() @MenuAccess('Leave Management', 'canView')
  async list(@Headers('x-organization-id') organization: string, @Query() query: TenantPaginationDto) { return new BaseResponseDto(await this.workforce.listLeave(organizationId(organization), query)); }
  @Post() @MenuAccess('Leave Management', 'canCreate')
  async create(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateLeaveRequestDto) { return new BaseResponseDto(await this.workforce.requestLeave(organizationId(organization), user.userId, dto), 'Leave request submitted successfully'); }
  @Post(':id/decision') @MenuAccess('Leave Management', 'canUpdate')
  async decide(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: LeaveDecisionDto) { return new BaseResponseDto(await this.workforce.decideLeave(organizationId(organization), user.userId, id, dto), 'Leave decision recorded successfully'); }
  @Post(':id/cancel') @MenuAccess('Leave Management', 'canUpdate')
  async cancel(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelLeaveDto) { return new BaseResponseDto(await this.workforce.cancelLeave(organizationId(organization), user.userId, id, dto), 'Leave request cancelled successfully'); }
}
