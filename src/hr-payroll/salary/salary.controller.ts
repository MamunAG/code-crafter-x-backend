import { BadRequestException, Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { AssignSalaryDto } from './dto/assign-salary.dto';
import { SalaryService } from './salary.service';

function organizationId(value?: string) { if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.'); return value.trim(); }

@ApiTags('HR Salary') @ApiBearerAuth() @Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/compensation/salary-assignments')
export class SalaryController {
  constructor(private readonly service: SalaryService) {}
  @Post() @MenuAccess('Compensation Setup', 'canCreate')
  async assign(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: AssignSalaryDto) { return new BaseResponseDto(await this.service.assignSalary(organizationId(organization), user.userId, dto), 'Salary assigned successfully'); }
}
