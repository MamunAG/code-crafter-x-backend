import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { StyleService } from './style.service';
import { CreateStyleDto } from './dto/create-style.dto';
import { FilterStyleDto } from './dto/filter-style.dto';
import { UpdateStyleDto } from './dto/update-style.dto';

@ApiTags('Style')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/style')
export class StyleController {
  constructor(
    private readonly styleService: StyleService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all styles' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterStyleDto) {
    const { page, limit, ...styleFilters } = filters;
    const pagination = { page, limit };
    const styles = await this.styleService.findAll(pagination, styleFilters);
    return new BaseResponseDto(styles, 'Styles retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific style' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const style = await this.styleService.findOne(id);
    return new BaseResponseDto(style, 'Style retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'save style' })
  @ApiResponse({ status: 201, description: 'Style save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Style already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateStyleDto) {
    dto.created_by_id = user.userId;
    const result = await this.styleService.create(dto);
    return new BaseResponseDto(result, 'Style saved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'update style' })
  @ApiResponse({ status: 201, description: 'Style update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Style already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStyleDto,
  ) {
    dto.updated_by_id = user.userId;
    const result = await this.styleService.update(id, dto);
    return new BaseResponseDto(result, 'Style updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'delete style' })
  @ApiResponse({ status: 200, description: 'Style delete successfully', type: BaseResponseDto })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.styleService.remove(id);
    return new BaseResponseDto(result, 'Style deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'delete style permanently' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.styleService.permanentRemove(id);
    return new BaseResponseDto(result, 'Style deleted permanently');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'restore style' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.styleService.restore(id);
    return new BaseResponseDto(result, 'Style restored successfully');
  }
}
