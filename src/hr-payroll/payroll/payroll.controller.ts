import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { TenantPaginationDto } from '../common/dto/tenant-pagination.dto';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { PayrollTransitionDto } from './dto/payroll-transition.dto';
import { PayrollService } from './payroll.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Payroll')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/payroll-runs')
export class PayrollController {
  constructor(private readonly service: PayrollService) {}
  @Get() @MenuAccess('Payroll Processing', 'canView') async list(@Headers('x-organization-id') organization: string, @Query() query: TenantPaginationDto) { return new BaseResponseDto(await this.service.list(organizationId(organization), query)); }
  @Get(':id') @MenuAccess('Payroll Processing', 'canView') async one(@Headers('x-organization-id') organization: string, @Param('id', ParseUUIDPipe) id: string) { return new BaseResponseDto(await this.service.findOne(organizationId(organization), id)); }
  @Get(':id/details') @MenuAccess('Payroll Processing', 'canView') async details(@Headers('x-organization-id') organization: string, @Param('id', ParseUUIDPipe) id: string, @Query() query: TenantPaginationDto) { return new BaseResponseDto(await this.service.details(organizationId(organization), id, query)); }
  @Post() @MenuAccess('Payroll Processing', 'canCreate') async create(@Headers('x-organization-id') organization: string, @Headers('idempotency-key') key: string, @CurrentUser() user: AuthUser, @Body() dto: CreatePayrollRunDto) { return new BaseResponseDto(await this.service.create(organizationId(organization), user.userId, key, dto), 'Payroll run created successfully'); }
  @Post(':id/calculate') @MenuAccess('Payroll Processing', 'canUpdate') async calculate(@Headers('x-organization-id') organization: string, @Headers('idempotency-key') key: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PayrollTransitionDto) { return new BaseResponseDto(await this.service.calculate(organizationId(organization), user.userId, id, dto, key), 'Payroll calculation queued'); }
  @Post(':id/submit-review') @MenuAccess('Payroll Processing', 'canUpdate') async review(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PayrollTransitionDto) { return new BaseResponseDto(await this.service.submitReview(organizationId(organization), user.userId, id, dto)); }
  @Post(':id/approve') @MenuAccess('Payroll Processing', 'canUpdate') async approve(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PayrollTransitionDto) { return new BaseResponseDto(await this.service.approve(organizationId(organization), user.userId, id, dto)); }
  @Post(':id/lock') @MenuAccess('Payroll Processing', 'canUpdate') async lock(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PayrollTransitionDto) { return new BaseResponseDto(await this.service.lock(organizationId(organization), user.userId, id, dto)); }
  @Post(':id/reject') @MenuAccess('Payroll Processing', 'canUpdate') async reject(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PayrollTransitionDto) { return new BaseResponseDto(await this.service.reject(organizationId(organization), user.userId, id, dto)); }
  @Post(':id/reverse') @MenuAccess('Payroll Processing', 'canUpdate') async reverse(@Headers('x-organization-id') organization: string, @Headers('idempotency-key') key: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PayrollTransitionDto) { return new BaseResponseDto(await this.service.reverse(organizationId(organization), user.userId, id, key, dto)); }
  @Get('jobs/:id/status') @MenuAccess('Payroll Processing', 'canView') async job(@Headers('x-organization-id') organization: string, @Param('id', ParseUUIDPipe) id: string) { return new BaseResponseDto(await this.service.jobStatus(organizationId(organization), id)); }
  @Post(':id/paid-status/:status') @MenuAccess('Payroll Processing', 'canUpdate') async paid(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Param('status') status: string) { return new BaseResponseDto(await this.service.markPaidStatus(organizationId(organization), user.userId, id, status)); }
}
