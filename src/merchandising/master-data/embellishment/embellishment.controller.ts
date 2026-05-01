import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from '../../../common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { EmbellishmentService } from './embellishment.service';
import { CreateEmbellishmentDto } from './dto/create-embellishment.dto';
import { FilterEmbellishmentDto } from './dto/filter-embellishment.dto';
import { UpdateEmbellishmentDto } from './dto/update-embellishment.dto';

const MENU_NAME = 'Embellishment';

@ApiTags('Embellishment')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/embellishment')
export class EmbellishmentController {
  constructor(
    private readonly embellishmentService: EmbellishmentService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all items' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterEmbellishmentDto) {
    const { page, limit, ...embellishmentFilters } = filters;
    const pagination = { page, limit };
    const embellishments = await this.embellishmentService.findAll(pagination, embellishmentFilters);
    return new BaseResponseDto(embellishments, 'Embellishments retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific item' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    const embellishment = await this.embellishmentService.findOne(id);
    return new BaseResponseDto(embellishment, 'Embellishment retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'save item' })
  @ApiResponse({ status: 201, description: 'Item save successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Item already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateEmbellishmentDto) {
    dto.created_by_id = user.userId;
    dto.updated_by_id = null as unknown as string;
    dto.updated_at = null as unknown as Date;
    const result = await this.embellishmentService.create(dto);
    return new BaseResponseDto(result, 'Embellishment saved successfully');
  }

  @Patch(':id')
  @Roles(RolesEnum.admin)
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'update item' })
  @ApiResponse({ status: 201, description: 'Item update successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'Item already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateEmbellishmentDto,
  ) {
    dto.updated_by_id = user.userId;
    dto.updated_at = new Date();
    const result = await this.embellishmentService.update(id, dto);
    return new BaseResponseDto(result, 'Embellishment updated successfully');
  }

  @Delete(':id')
  @Roles(RolesEnum.admin)
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete item' })
  @ApiResponse({ status: 200, description: 'Item delete successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseIntPipe()) id: number) {
    const result = await this.embellishmentService.remove(id, user.userId);
    return new BaseResponseDto(result, 'Embellishment deleted successfully');
  }

  @Delete(':id/permanent')
  @Roles(RolesEnum.admin)
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete item permanently' })
  async permanentRemove(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.embellishmentService.permanentRemove(id);
    return new BaseResponseDto(result, 'Embellishment deleted permanently');
  }

  @Post(':id/restore')
  @Roles(RolesEnum.admin)
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'restore item' })
  async restore(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.embellishmentService.restore(id);
    return new BaseResponseDto(result, 'Embellishment restored successfully');
  }
}
