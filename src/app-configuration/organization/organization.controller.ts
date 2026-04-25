import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FilterOrganizationDto } from './dto/filter-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('Organization')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/organization')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all organizations' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterOrganizationDto) {
    const { page, limit, ...organizationFilters } = filters;
    const pagination = { page, limit };
    const organizations = await this.organizationService.findAll(pagination, organizationFilters);
    return new BaseResponseDto(organizations, 'Organizations retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific organization' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const organization = await this.organizationService.findOne(id);
    return new BaseResponseDto(organization, 'Organization retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'save organization' })
  @ApiResponse({ status: 201, description: 'Organization save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Organization already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    const result = await this.organizationService.create(dto, user.userId);
    return new BaseResponseDto(result, 'Organization saved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'update organization' })
  @ApiResponse({ status: 201, description: 'Organization update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Organization already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const result = await this.organizationService.update(id, dto, user.userId);
    return new BaseResponseDto(result, 'Organization updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'delete organization' })
  @ApiResponse({ status: 200, description: 'Organization delete successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.organizationService.remove(id, user.userId);
    return new BaseResponseDto(result, 'Organization deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'delete organization permanently' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.organizationService.permanentRemove(id);
    return new BaseResponseDto(result, 'Organization deleted permanently');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'restore organization' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.organizationService.restore(id);
    return new BaseResponseDto(result, 'Organization restored successfully');
  }
}
