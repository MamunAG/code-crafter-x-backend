import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CountryService } from './country.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { FilterCountryDto } from './dto/filter-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

const MENU_NAME = 'Country Setup';

@ApiTags('Country')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/country')
export class CountryController {
  constructor(
    private readonly countryService: CountryService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all countries' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterCountryDto) {
    const { page, limit, ...countryFilters } = filters;
    const pagination = { page, limit };
    const countries = await this.countryService.findAll(pagination, countryFilters);
    return new BaseResponseDto(countries, 'Countries retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific country' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    const country = await this.countryService.findOne(id);
    return new BaseResponseDto(country, 'Country retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'save country' })
  @ApiResponse({ status: 201, description: 'Country save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Country already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateCountryDto) {
    dto.created_by_id = user.userId;
    dto.updated_by_id = null as unknown as string;
    dto.updated_at = null as unknown as Date;
    const result = await this.countryService.create(dto);
    return new BaseResponseDto(result, 'Country saved successfully');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'update country' })
  @ApiResponse({ status: 201, description: 'Country update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Country already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateCountryDto,
  ) {
    dto.updated_by_id = user.userId;
    dto.updated_at = new Date();
    const result = await this.countryService.update(id, dto);
    return new BaseResponseDto(result, 'Country updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete country' })
  @ApiResponse({ status: 200, description: 'Country delete successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseIntPipe()) id: number) {
    const result = await this.countryService.remove(id, user.userId);
    return new BaseResponseDto(result, 'Country deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete country permanently' })
  async permanentRemove(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.countryService.permanentRemove(id);
    return new BaseResponseDto(result, 'Country deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'restore country' })
  async restore(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.countryService.restore(id);
    return new BaseResponseDto(result, 'Country restored successfully');
  }
}
