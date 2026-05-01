import { BadRequestException, Body, Controller, Delete, Get, Header, Headers, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from '../../common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { FilterCurrencyDto } from './dto/filter-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

const MENU_NAME = 'Currency Setup';

@ApiTags('Currency')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/currency')
export class CurrencyController {
  constructor(
    private readonly currencyService: CurrencyService,
  ) { }

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to manage currency records. Please select an organization and try again.');
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all currencies' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterCurrencyDto, @Headers('x-organization-id') organizationId?: string) {
    const { page, limit, ...currencyFilters } = filters;
    const pagination = { page, limit };
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const currencies = await this.currencyService.findAll(pagination, currencyFilters, selectedOrganizationId);
    return new BaseResponseDto(currencies, 'Currencies retrieved successfully');
  }

  @Get('template/upload')
  @MenuAccess(MENU_NAME, 'canCreate')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="currency-upload-template.csv"')
  @ApiOperation({ summary: 'Download currency upload template' })
  downloadUploadTemplate(@Headers('x-organization-id') organizationId?: string) {
    this.requireOrganizationId(organizationId);
    return this.currencyService.buildUploadTemplate();
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific currency' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const currency = await this.currencyService.findOne(id, selectedOrganizationId);
    return new BaseResponseDto(currency, 'Currency retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'save currency' })
  @ApiResponse({ status: 201, description: 'Currency save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Currency already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateCurrencyDto, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.created_by_id = user.userId;
    dto.updated_by_id = null as unknown as string;
    dto.updated_at = null as unknown as Date;
    const result = await this.currencyService.create(dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'Currency saved successfully');
  }

  @Post('upload')
  @MenuAccess(MENU_NAME, 'canCreate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload currency template' })
  async uploadTemplate(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.currencyService.importFromTemplate(file, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Currency upload completed');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'update currency' })
  @ApiResponse({ status: 201, description: 'Currency update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Currency already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateCurrencyDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.updated_by_id = user.userId;
    dto.updated_at = new Date();
    const result = await this.currencyService.update(id, dto, selectedOrganizationId);
    return new BaseResponseDto(result, 'Currency updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete currency' })
  @ApiResponse({ status: 200, description: 'Currency delete successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.currencyService.remove(id, user.userId, selectedOrganizationId);
    return new BaseResponseDto(result, 'Currency deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete currency permanently' })
  async permanentRemove(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.currencyService.permanentRemove(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Currency deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'restore currency' })
  async restore(@Param('id', new ParseIntPipe()) id: number, @Headers('x-organization-id') organizationId?: string) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.currencyService.restore(id, selectedOrganizationId);
    return new BaseResponseDto(result, 'Currency restored successfully');
  }
}
