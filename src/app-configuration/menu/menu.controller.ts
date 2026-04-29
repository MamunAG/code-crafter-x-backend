import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateMenuDto } from './dto/create-menu.dto';
import { FilterMenuDto } from './dto/filter-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuService } from './menu.service';

@ApiTags('Menu')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Get menu entries' })
  async findAll(@Query() filters: FilterMenuDto) {
    const { page, limit, ...menuFilters } = filters;
    const result = await this.menuService.findAll({ page, limit }, menuFilters);
    return new BaseResponseDto(result, 'Menu entries retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get menu entry by id' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.menuService.findOne(id);
    return new BaseResponseDto(result, 'Menu entry retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'Create menu entry' })
  @ApiResponse({ status: 201, description: 'Menu entry saved successfully', type: BaseResponseDto })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateMenuDto) {
    dto.created_by_id = user.userId;
    const result = await this.menuService.create(dto);
    return new BaseResponseDto(result, 'Menu entry saved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update menu entry' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMenuDto,
  ) {
    dto.updated_by_id = user.userId;
    const result = await this.menuService.update(id, dto);
    return new BaseResponseDto(result, 'Menu entry updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete menu entry' })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.menuService.remove(id, user.userId);
    return new BaseResponseDto(result, 'Menu entry deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Delete menu entry permanently' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.menuService.permanentRemove(id);
    return new BaseResponseDto(result, 'Menu entry deleted permanently');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore menu entry' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.menuService.restore(id);
    return new BaseResponseDto(result, 'Menu entry restored successfully');
  }
}
