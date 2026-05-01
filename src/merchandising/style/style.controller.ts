import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { StyleService } from './style.service';
import { CreateStyleDto } from './dto/create-style.dto';
import { FilterStyleDto } from './dto/filter-style.dto';
import { UpdateStyleDto } from './dto/update-style.dto';

const MENU_NAME = 'Style Setup';

@ApiTags('Style')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/style')
export class StyleController {
  constructor(
    private readonly styleService: StyleService,
  ) { }

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to manage style records. Please select an organization and try again.');
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all styles' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterStyleDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...styleFilters } = filters;
    const pagination = { page, limit };
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const styles = await this.styleService.findAll(pagination, styleFilters, selectedOrganizationId);
    return new BaseResponseDto(styles, 'Styles retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific style' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const style = await this.styleService.findOne(id, selectedOrganizationId);
    return new BaseResponseDto(style, 'Style retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'save style' })
  @ApiResponse({ status: 201, description: 'Style save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Style already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateStyleDto, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.created_by_id = user.userId;
    dto.updated_by_id = null as unknown as string;
    dto.updated_at = null as unknown as Date;
    const result = await this.styleService.create(dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'Style saved successfully');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'update style' })
  @ApiResponse({ status: 201, description: 'Style update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Style already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStyleDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.updated_by_id = user.userId;
    dto.updated_at = new Date();
    const result = await this.styleService.update(id, dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'Style updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete style' })
  @ApiResponse({ status: 200, description: 'Style delete successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.styleService.remove(id, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Style deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete style permanently' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.styleService.permanentRemove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Style deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'restore style' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.styleService.restore(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Style restored successfully');
  }
}
