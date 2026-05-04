import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateJobDto } from './dto/create-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobService } from './job.service';

const MENU_NAME = 'Purchase Order';

@ApiTags('Job')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to manage job records. Please select an organization and try again.');
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all jobs', description: 'Retrieve all jobs' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterJobDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...jobFilters } = filters;
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const jobs = await this.jobService.findAll({ page, limit }, jobFilters, selectedOrganizationId);
    return new BaseResponseDto(jobs, 'Jobs retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get job by id', description: 'Retrieve specific job' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const job = await this.jobService.findOne(id, selectedOrganizationId);
    return new BaseResponseDto(job, 'Job retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'Save job' })
  @ApiResponse({ status: 201, description: 'Job saved successfully', type: BaseResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateJobDto, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.jobService.create(dto, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Job saved successfully');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({ status: 200, description: 'Job updated successfully', type: BaseResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateJobDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.jobService.update(id, dto, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Job updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete job' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.jobService.remove(id, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Job deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete job permanently' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.jobService.permanentRemove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Job deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Restore job' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.jobService.restore(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Job restored successfully');
  }
}
