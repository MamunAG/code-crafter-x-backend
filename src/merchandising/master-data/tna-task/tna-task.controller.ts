import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from '../../../common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateTnaTaskDto } from './dto/create-tna-task.dto';
import { FilterTnaTaskDto } from './dto/filter-tna-task.dto';
import { UpdateTnaTaskDto } from './dto/update-tna-task.dto';
import { TnaTaskService } from './tna-task.service';

const MENU_NAME = 'TNA Task Setup';

@ApiTags('TnaTask')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/tna-task')
export class TnaTaskController {
  constructor(private readonly tnaTaskService: TnaTaskService) {}

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all TNA tasks' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findAll(@Query() filters: FilterTnaTaskDto) {
    const { page, limit, ...taskFilters } = filters;
    const tasks = await this.tnaTaskService.findAll({ page, limit }, taskFilters);
    return new BaseResponseDto(tasks, 'TNA tasks retrieved successfully');
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve a specific TNA task' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const task = await this.tnaTaskService.findOne(id);
    return new BaseResponseDto(task, 'TNA task retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'Save task' })
  @ApiResponse({ status: 201, description: 'TNA task saved successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'TNA task already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateTnaTaskDto) {
    const result = await this.tnaTaskService.create(dto, user.userId);
    return new BaseResponseDto(result, 'TNA task saved successfully');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 201, description: 'TNA task updated successfully', type: BaseResponseDto })
  @ApiResponse({ status: 400, description: 'TNA task already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTnaTaskDto,
  ) {
    const result = await this.tnaTaskService.update(id, dto, user.userId);
    return new BaseResponseDto(result, 'TNA task updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 200, description: 'TNA task deleted successfully', type: BaseResponseDto })
  async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.tnaTaskService.remove(id, user.userId);
    return new BaseResponseDto(result, 'TNA task deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete task permanently' })
  async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.tnaTaskService.permanentRemove(id);
    return new BaseResponseDto(result, 'TNA task deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Restore task' })
  async restore(@Param('id', new ParseUUIDPipe()) id: string) {
    const result = await this.tnaTaskService.restore(id);
    return new BaseResponseDto(result, 'TNA task restored successfully');
  }
}
