import { BadRequestException, Body, Controller, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { AttendanceDecisionDto } from './dto/attendance-decision.dto';
import { CreateAttendanceCorrectionDto } from './dto/create-attendance-correction.dto';
import { CreateIntegrationCredentialDto } from './dto/create-integration-credential.dto';
import { CreateOvertimeRequestDto } from './dto/create-overtime-request.dto';
import { DeriveAttendanceDto } from './dto/derive-attendance.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { OvertimeDecisionDto } from './dto/overtime-decision.dto';
import { AttendanceService } from './attendance.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Attendance')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/attendance')
export class AttendanceController {
  constructor(private readonly workforce: AttendanceService) {}
  @Post('derive') @MenuAccess('Attendance Management', 'canUpdate')
  async derive(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: DeriveAttendanceDto) { return new BaseResponseDto(await this.workforce.deriveAttendance(organizationId(organization), user.userId, dto), 'Attendance derived successfully'); }
  @Post('punches/manual') @MenuAccess('Attendance Management', 'canCreate')
  async manualPunches(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: ManualAttendanceDto) { return new BaseResponseDto(await this.workforce.ingestManual(organizationId(organization), user.userId, dto), 'Manual attendance punches accepted'); }
  @Post('integration-credentials') @MenuAccess('Attendance Management', 'canCreate')
  async credential(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateIntegrationCredentialDto) { return new BaseResponseDto(await this.workforce.createCredential(organizationId(organization), user.userId, dto), 'Credential created; copy the secret now because it cannot be retrieved later'); }
  @Post('integration-credentials/:id/revoke') @MenuAccess('Attendance Management', 'canDelete')
  async revoke(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) { return new BaseResponseDto(await this.workforce.revokeCredential(organizationId(organization), user.userId, id), 'Credential revoked successfully'); }
  @Post('corrections') @MenuAccess('Attendance Management', 'canCreate')
  async correction(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateAttendanceCorrectionDto) { return new BaseResponseDto(await this.workforce.requestAttendanceCorrection(organizationId(organization), user.userId, dto), 'Attendance correction requested'); }
  @Post('corrections/:id/decision') @MenuAccess('Attendance Management', 'canUpdate')
  async correctionDecision(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AttendanceDecisionDto) { return new BaseResponseDto(await this.workforce.decideAttendanceCorrection(organizationId(organization), user.userId, id, dto), 'Attendance correction decision recorded'); }
  @Post('overtime') @MenuAccess('Attendance Management', 'canCreate')
  async overtime(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateOvertimeRequestDto) { return new BaseResponseDto(await this.workforce.requestOvertime(organizationId(organization), user.userId, dto), 'Overtime requested'); }
  @Post('overtime/:id/decision') @MenuAccess('Attendance Management', 'canUpdate')
  async overtimeDecision(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: OvertimeDecisionDto) { return new BaseResponseDto(await this.workforce.decideOvertime(organizationId(organization), user.userId, id, dto), 'Overtime decision recorded'); }
}
