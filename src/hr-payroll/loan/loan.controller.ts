import { BadRequestException, Body, Controller, Headers, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateLoanDto } from './dto/create-loan.dto';
import { LoanStatusDto } from './dto/loan-status.dto';
import { LoanService } from './loan.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Loans')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/loans')
export class LoanController {
  constructor(private readonly service: LoanService) {}
  @Post() @MenuAccess('Loan Management', 'canCreate')
  async create(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Body() dto: CreateLoanDto) { return new BaseResponseDto(await this.service.createLoan(organizationId(organization), user.userId, dto), 'Loan created successfully'); }
  @Post(':id/status') @MenuAccess('Loan Management', 'canUpdate')
  async status(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: LoanStatusDto) { return new BaseResponseDto(await this.service.changeLoanStatus(organizationId(organization), user.userId, id, dto), 'Loan status updated successfully'); }
}
