import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { EmployeeLifecycleDto } from './dto/employee-lifecycle.dto';
import { EmployeeLifecycleService } from './employee-lifecycle.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Employee Lifecycle')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/employees')
export class EmployeeLifecycleController {
  constructor(private readonly workforce: EmployeeLifecycleService) {}
  @Get(':id/history') @MenuAccess('Employee Setup', 'canView')
  async history(@Headers('x-organization-id') organization: string, @Param('id', ParseUUIDPipe) id: string) {
    return new BaseResponseDto(await this.workforce.employeeHistory(organizationId(organization), id), 'Employee history retrieved successfully');
  }
  @Post(':id/lifecycle') @MenuAccess('Employee Setup', 'canUpdate')
  async lifecycle(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: EmployeeLifecycleDto) {
    return new BaseResponseDto(await this.workforce.applyLifecycle(organizationId(organization), user.userId, id, dto), 'Employee lifecycle updated successfully');
  }
}
