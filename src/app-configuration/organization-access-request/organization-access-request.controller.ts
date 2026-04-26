import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { ApproveOrganizationAccessRequestDto } from './dto/approve-organization-access-request.dto';
import { CreateOrganizationAccessRequestDto } from './dto/create-organization-access-request.dto';
import { RejectOrganizationAccessRequestDto } from './dto/reject-organization-access-request.dto';
import { OrganizationAccessRequestService } from './organization-access-request.service';

@ApiTags('Organization Access Requests')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/organization-access-requests')
export class OrganizationAccessRequestController {
  constructor(
    private readonly organizationAccessRequestService: OrganizationAccessRequestService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit an organization access request' })
  @ApiResponse({ status: 201, description: 'Request submitted successfully', type: BaseResponseDto })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrganizationAccessRequestDto,
  ) {
    const result = await this.organizationAccessRequestService.create(user.userId, dto);
    return new BaseResponseDto(result, 'Organization access request submitted successfully');
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending requests for the current admin' })
  async findPending(@CurrentUser() user: AuthUser) {
    const result = await this.organizationAccessRequestService.findPendingForAdmin(user.userId);
    return new BaseResponseDto(result, 'Pending access requests retrieved successfully');
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve an access request' })
  async approve(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ApproveOrganizationAccessRequestDto,
  ) {
    const result = await this.organizationAccessRequestService.approve(id, user.userId, dto);
    return new BaseResponseDto(result, 'Organization access request approved successfully');
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject an access request' })
  async reject(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectOrganizationAccessRequestDto,
  ) {
    const result = await this.organizationAccessRequestService.reject(id, user.userId, dto);
    return new BaseResponseDto(result, 'Organization access request rejected successfully');
  }
}
