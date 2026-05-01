import { BadRequestException, Body, Controller, Delete, Get, Header, Headers, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { BuyerService } from './buyer.service';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { FilterBuyerDto } from './dto/filter-buyer.dto';
import { UpdateBuyerDto } from './dto/update-buyer.dto';

const MENU_NAME = 'Buyer Setup';

@ApiTags('Buyer')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/buyer')
export class BuyerController {
  constructor(
    private readonly buyerService: BuyerService,
  ) { }

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to manage buyer records. Please select an organization and try again.');
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all buyers' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterBuyerDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...buyerFilters } = filters;
    const pagination = { page, limit };
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const buyers = await this.buyerService.findAll(pagination, buyerFilters, selectedOrganizationId);
    return new BaseResponseDto(buyers, 'Buyers retrieved successfully');
  }

  @Get('template/upload')
  @MenuAccess(MENU_NAME, 'canCreate')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="buyer-upload-template.csv"')
  @ApiOperation({ summary: 'Download buyer upload template' })
  downloadUploadTemplate(@Headers('x-organization-id') organizationId?: string) {
    this.requireOrganizationId(organizationId);
    return this.buyerService.buildUploadTemplate();
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific buyer' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const buyer = await this.buyerService.findOne(id, selectedOrganizationId);
    return new BaseResponseDto(buyer, 'Buyer retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'save buyer' })
  @ApiResponse({ status: 201, description: 'Buyer save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Buyer already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateBuyerDto, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.created_by_id = user.userId;
    dto.updated_by_id = null as unknown as string;
    dto.updated_at = null as unknown as Date;
    const result = await this.buyerService.create(dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'Buyer saved successfully');
  }

  @Post('upload')
  @MenuAccess(MENU_NAME, 'canCreate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload buyer template' })
  async uploadTemplate(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.buyerService.importFromTemplate(file, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Buyer upload completed');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'update buyer' })
  @ApiResponse({ status: 201, description: 'Buyer update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Buyer already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateBuyerDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.updated_by_id = user.userId;
    dto.updated_at = new Date();
    const result = await this.buyerService.update(id, dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'Buyer updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete buyer' })
  @ApiResponse({ status: 200, description: 'Buyer delete successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.buyerService.remove(id, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Buyer deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete buyer permanently' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.buyerService.permanentRemove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Buyer deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'restore buyer' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.buyerService.restore(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Buyer restored successfully');
  }
}
