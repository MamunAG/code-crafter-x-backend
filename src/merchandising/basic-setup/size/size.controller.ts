import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { SizeService } from './size.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { FilterSizeDto } from './dto/filter-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

@ApiTags('Size')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/size')
export class SizeController {
  constructor(
    private readonly sizeService: SizeService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all items' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterSizeDto) {
    const { page, limit, ...sizeFilters } = filters;
    const pagination = { page, limit };
    const sizes = await this.sizeService.findAll(pagination, sizeFilters);
    return new BaseResponseDto(sizes, 'Sizes retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific item' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    const size = await this.sizeService.findOne(id);
    return new BaseResponseDto(size, 'Size retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'save item' })
  @ApiResponse({ status: 201, description: 'Item save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Item already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateSizeDto) {
    dto.created_by_id = user.userId;
    const result = await this.sizeService.create(dto);
    return new BaseResponseDto(result, 'Size saved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'update item' })
  @ApiResponse({ status: 201, description: 'Item update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Item already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateSizeDto,
  ) {
    dto.updated_by_id = user.userId;
    const result = await this.sizeService.update(id, dto);
    return new BaseResponseDto(result, 'Size updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'delete item' })
  @ApiResponse({ status: 200, description: 'Item delete successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseIntPipe()) id: number) {
    const result = await this.sizeService.remove(id, user.userId);
    return new BaseResponseDto(result, 'Size deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'delete item permanently' })
  async permanentRemove(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.sizeService.permanentRemove(id);
    return new BaseResponseDto(result, 'Size deleted permanently');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'restore item' })
  async restore(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.sizeService.restore(id);
    return new BaseResponseDto(result, 'Size restored successfully');
  }
}
