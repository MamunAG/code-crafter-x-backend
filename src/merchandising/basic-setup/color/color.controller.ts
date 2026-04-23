import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { ColorService } from './color.service';
import { CreateColorDto } from './dto/create-color.dto';
import { FilterColorDto } from './dto/filter-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@ApiTags('Color')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/color')
export class ColorController {
  constructor(
    private readonly colorService: ColorService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all items' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterColorDto) {
    const { page, limit, ...colorFilters } = filters;
    const pagination = { page, limit };
    const colors = await this.colorService.findAll(pagination, colorFilters);
    return new BaseResponseDto(colors, 'Colors retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific item' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    const color = await this.colorService.findOne(id);
    return new BaseResponseDto(color, 'Color retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'save item' })
  @ApiResponse({ status: 201, description: 'Item save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Item already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateColorDto) {
    dto.created_by_id = user.userId;
    const result = await this.colorService.create(dto);
    return new BaseResponseDto(result, 'Color saved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'update item' })
  @ApiResponse({ status: 201, description: 'Item update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Item already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateColorDto,
  ) {
    dto.updated_by_id = user.userId;
    const result = await this.colorService.update(id, dto);
    return new BaseResponseDto(result, 'Color updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'delete item' })
  @ApiResponse({ status: 200, description: 'Item delete successfully', type: BaseResponseDto })
  async remove(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.colorService.remove(id);
    return new BaseResponseDto(result, 'Color deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'delete item permanently' })
  async permanentRemove(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.colorService.permanentRemove(id);
    return new BaseResponseDto(result, 'Color deleted permanently');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'restore item' })
  async restore(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.colorService.restore(id);
    return new BaseResponseDto(result, 'Color restored successfully');
  }
}
