import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all currencies' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterCurrencyDto) {
    const { page, limit, ...currencyFilters } = filters;
    const pagination = { page, limit };
    const currencies = await this.currencyService.findAll(pagination, currencyFilters);
    return new BaseResponseDto(currencies, 'Currencies retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific currency' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    const currency = await this.currencyService.findOne(id);
    return new BaseResponseDto(currency, 'Currency retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'save currency' })
  @ApiResponse({ status: 201, description: 'Currency save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Currency already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateCurrencyDto) {
    dto.created_by_id = user.userId;
    dto.updated_by_id = null as unknown as string;
    dto.updated_at = null as unknown as Date;
    const result = await this.currencyService.create(dto);
    return new BaseResponseDto(result, 'Currency saved successfully');
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
  ) {
    dto.updated_by_id = user.userId;
    dto.updated_at = new Date();
    const result = await this.currencyService.update(id, dto);
    return new BaseResponseDto(result, 'Currency updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete currency' })
  @ApiResponse({ status: 200, description: 'Currency delete successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseIntPipe()) id: number) {
    const result = await this.currencyService.remove(id, user.userId);
    return new BaseResponseDto(result, 'Currency deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete currency permanently' })
  async permanentRemove(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.currencyService.permanentRemove(id);
    return new BaseResponseDto(result, 'Currency deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'restore currency' })
  async restore(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.currencyService.restore(id);
    return new BaseResponseDto(result, 'Currency restored successfully');
  }
}
