import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateMaterialGroupDto } from './dto/create-material-group.dto';
import { FilterMaterialGroupDto } from './dto/filter-material-group.dto';
import { UpdateMaterialGroupDto } from './dto/update-material-group.dto';
import { MaterialGroupService } from './material-group.service';

const MENU_NAME = 'Material Group Entry';

@ApiTags('Material Group')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/material-group')
export class MaterialGroupController {
  constructor(private readonly materialGroupService: MaterialGroupService) {}

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException(
        'An organization is required to manage material group records. Please select an organization and try again.',
      );
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({
    summary: 'Get all',
    description: 'Retrieve all material groups',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async findAll(
    @Query() filters: FilterMaterialGroupDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const { page, limit, ...groupFilters } = filters;
    const pagination = { page, limit };
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const groups = await this.materialGroupService.findAll(
      pagination,
      groupFilters,
      selectedOrganizationId,
    );
    return new BaseResponseDto(
      groups,
      'Material groups retrieved successfully',
    );
  }

  @Get('template/upload')
  @MenuAccess(MENU_NAME, 'canCreate')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="material-group-upload-template.csv"',
  )
  @ApiOperation({ summary: 'Download material group upload template' })
  downloadUploadTemplate(@Headers('x-organization-id') organizationId?: string) {
    this.requireOrganizationId(organizationId);
    return this.materialGroupService.buildUploadTemplate();
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({
    summary: 'Get by id',
    description: 'Retrieve specific material group',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async findOne(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const group = await this.materialGroupService.findOne(
      id,
      selectedOrganizationId,
    );
    return new BaseResponseDto(group, 'Material group retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'save material group' })
  @ApiResponse({
    status: 201,
    description: 'Material group save successfully',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Material group already exists' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMaterialGroupDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.created_by_id = user.userId;
    dto.updated_by_id = null as unknown as string;
    dto.updated_at = null as unknown as Date;
    const result = await this.materialGroupService.create(
      dto,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material group saved successfully');
  }

  @Post('upload')
  @MenuAccess(MENU_NAME, 'canCreate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload material group template' })
  async uploadTemplate(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.materialGroupService.importFromTemplate(
      file,
      user.userId,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material group upload completed');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'update material group' })
  @ApiResponse({
    status: 201,
    description: 'Material group update successfully',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Material group already exists' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMaterialGroupDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.updated_by_id = user.userId;
    dto.updated_at = new Date();
    const result = await this.materialGroupService.update(
      id,
      dto,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material group updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete material group' })
  @ApiResponse({
    status: 200,
    description: 'Material group delete successfully',
    type: BaseResponseDto,
  })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.materialGroupService.remove(
      id,
      user.userId,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material group deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete material group permanently' })
  async permanentRemove(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.materialGroupService.permanentRemove(
      id,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material group deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'restore material group' })
  async restore(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.materialGroupService.restore(
      id,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material group restored successfully');
  }
}
