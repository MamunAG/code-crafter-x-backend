import { BadRequestException, Body, Controller, ForbiddenException, Get, Headers, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
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
import { LeaveBalanceAdjustmentDto, LeaveQueryDto } from './dto/leave-query.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationTypeEnum } from 'src/common/enums/notification-type.enum';
import { ApprovalStatus } from '../common/hr.enums';
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
  constructor(private readonly workforce: LeaveService, private readonly notifications: NotificationsService) {}
  @Get() @MenuAccess('Leave Management', 'canView')
  async list(@Headers('x-organization-id') organization: string, @Query() query: LeaveQueryDto) { return new BaseResponseDto(await this.workforce.listLeave(organizationId(organization), query)); }
  @Get('my-applications') @MenuAccess('Leave Management', 'canView')
  async mine(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Query() query: LeaveQueryDto) { return new BaseResponseDto(await this.workforce.listLeave(organizationId(organization), query, user.userId, 'mine')); }
  @Get('approval-inbox') @MenuAccess('Leave Management', 'canUpdate')
  async inbox(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Query() query: LeaveQueryDto) { return new BaseResponseDto(await this.workforce.listLeave(organizationId(organization), query, user.userId, 'inbox')); }
  @Get('dashboard') @MenuAccess('Leave Management', 'canView')
  async dashboard(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser) { return new BaseResponseDto(await this.workforce.leaveDashboard(organizationId(organization), user.userId, user.email)); }
  @Get('balances/:employeeId') @MenuAccess('Leave Management', 'canView')
  async balances(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('employeeId', ParseUUIDPipe) employeeId: string, @Query('year') year?: string) { const org = organizationId(organization); if (user.role !== RolesEnum.admin) await this.workforce.assertLeaveEmployeeAccess(org, employeeId, user.email); return new BaseResponseDto(await this.workforce.leaveBalancesFor(org, employeeId, year ? Number(year) : undefined)); }
  @Get('ledger/:employeeId') @MenuAccess('Leave Management', 'canView')
  async ledger(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('employeeId', ParseUUIDPipe) employeeId: string, @Query() query: LeaveQueryDto) { const org = organizationId(organization); if (user.role !== RolesEnum.admin) await this.workforce.assertLeaveEmployeeAccess(org, employeeId, user.email); return new BaseResponseDto(await this.workforce.leaveLedger(org, employeeId, query)); }
  @Post('preview') @MenuAccess('Leave Management', 'canCreate')
  async preview(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateLeaveRequestDto) { const org = organizationId(organization); if (user.role !== RolesEnum.admin) await this.workforce.assertLeaveEmployeeAccess(org, dto.employeeId, user.email); return new BaseResponseDto(await this.workforce.previewLeave(org, dto)); }
  @Post('balances/adjust') @MenuAccess('Leave Management', 'canUpdate')
  async adjust(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: LeaveBalanceAdjustmentDto) { if (user.role !== RolesEnum.admin) throw new ForbiddenException('Only HR administrators can adjust leave balances.'); return new BaseResponseDto(await this.workforce.adjustLeaveBalance(organizationId(organization), user.userId, dto)); }
  @Post() @MenuAccess('Leave Management', 'canCreate')
  async create(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateLeaveRequestDto) { const org = organizationId(organization); if (user.role !== RolesEnum.admin) await this.workforce.assertLeaveEmployeeAccess(org, dto.employeeId, user.email); return new BaseResponseDto(await this.workforce.requestLeave(org, user.userId, dto), 'Leave request submitted successfully'); }
  @Get(':id') @MenuAccess('Leave Management', 'canView')
  async details(@Headers('x-organization-id') organization: string, @Param('id', ParseUUIDPipe) id: string) { return new BaseResponseDto(await this.workforce.leaveDetails(organizationId(organization), id)); }
  @Post(':id/resubmit') @MenuAccess('Leave Management', 'canUpdate')
  async resubmit(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return new BaseResponseDto(await this.workforce.resubmitLeave(organizationId(organization), user.userId, id), 'Leave request resubmitted successfully'); }
  @Post(':id/decision') @MenuAccess('Leave Management', 'canUpdate')
  async decide(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: LeaveDecisionDto) {
    const result = await this.workforce.decideLeave(organizationId(organization), user.userId, id, dto);
    const notificationTypes: Partial<Record<ApprovalStatus, NotificationTypeEnum>> = { [ApprovalStatus.Approved]: NotificationTypeEnum.leave_approved, [ApprovalStatus.Rejected]: NotificationTypeEnum.leave_rejected, [ApprovalStatus.Returned]: NotificationTypeEnum.leave_returned };
    if (result.createdById && notificationTypes[dto.decision]) await this.notifications.createForUser({ userId: result.createdById, createdById: user.userId, title: `Leave application ${dto.decision.toLowerCase()}`, body: dto.comment?.trim() || `Your leave application ${result.applicationNumber ?? id} is now ${dto.decision.toLowerCase()}.`, type: notificationTypes[dto.decision], link: `/hr-payroll/leave?view=applications`, metadata: { entityId: id, status: dto.decision } });
    return new BaseResponseDto(result, 'Leave decision recorded successfully');
  }
  @Post(':id/cancel') @MenuAccess('Leave Management', 'canUpdate')
  async cancel(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelLeaveDto) { return new BaseResponseDto(await this.workforce.cancelLeave(organizationId(organization), user.userId, id, dto), 'Leave request cancelled successfully'); }
}
