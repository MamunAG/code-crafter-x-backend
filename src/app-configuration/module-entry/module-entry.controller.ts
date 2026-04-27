import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateModuleEntryDto } from './dto/create-module-entry.dto';
import { FilterModuleEntryDto } from './dto/filter-module-entry.dto';
import { UpdateModuleEntryDto } from './dto/update-module-entry.dto';
import { ModuleEntryService } from './module-entry.service';

@ApiTags('Module Entry')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/module-entry')
export class ModuleEntryController {
  constructor(private readonly moduleEntryService: ModuleEntryService) {}

  @Get()
  @ApiOperation({ summary: 'Get module entries' })
  async findAll(@Query() filters: FilterModuleEntryDto) {
    const { page, limit, ...moduleEntryFilters } = filters;
    const result = await this.moduleEntryService.findAll({ page, limit }, moduleEntryFilters);
    return new BaseResponseDto(result, 'Module entries retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get module entry by id' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.moduleEntryService.findOne(id);
    return new BaseResponseDto(result, 'Module entry retrieved successfully');
  }

  @Post()
  @ApiOperation({ summary: 'Create module entry' })
  @ApiResponse({ status: 201, description: 'Module entry saved successfully', type: BaseResponseDto })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateModuleEntryDto) {
    dto.created_by_id = user.userId;
    const result = await this.moduleEntryService.create(dto);
    return new BaseResponseDto(result, 'Module entry saved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update module entry' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateModuleEntryDto,
  ) {
    dto.updated_by_id = user.userId;
    const result = await this.moduleEntryService.update(id, dto);
    return new BaseResponseDto(result, 'Module entry updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete module entry' })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.moduleEntryService.remove(id, user.userId);
    return new BaseResponseDto(result, 'Module entry deleted successfully');
  }
}
