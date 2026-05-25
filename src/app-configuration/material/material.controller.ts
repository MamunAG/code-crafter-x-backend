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
import { CreateMaterialDto } from './dto/create-material.dto';
import { FilterMaterialDto } from './dto/filter-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialService } from './material.service';

const MENU_NAME = 'Material Entry';

@ApiTags('Material')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException(
        'An organization is required to manage material records. Please select an organization and try again.',
      );
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all materials' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async findAll(
    @Query() filters: FilterMaterialDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const { page, limit, ...materialFilters } = filters;
    const pagination = { page, limit };
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const materials = await this.materialService.findAll(
      pagination,
      materialFilters,
      selectedOrganizationId,
    );
    return new BaseResponseDto(materials, 'Materials retrieved successfully');
  }

  @Get('template/upload')
  @MenuAccess(MENU_NAME, 'canCreate')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="material-upload-template.csv"')
  @ApiOperation({ summary: 'Download material upload template' })
  downloadUploadTemplate(@Headers('x-organization-id') organizationId?: string) {
    this.requireOrganizationId(organizationId);
    return this.materialService.buildUploadTemplate();
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific material' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async findOne(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const material = await this.materialService.findOne(
      id,
      selectedOrganizationId,
    );
    return new BaseResponseDto(material, 'Material retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'save material' })
  @ApiResponse({
    status: 201,
    description: 'Material save successfully',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Material already exists' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMaterialDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.created_by_id = user.userId;
    dto.updated_by_id = null as unknown as string;
    dto.updated_at = null as unknown as Date;
    const result = await this.materialService.create(
      dto,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material saved successfully');
  }

  @Post('upload')
  @MenuAccess(MENU_NAME, 'canCreate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload material template' })
  async uploadTemplate(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.materialService.importFromTemplate(
      file,
      user.userId,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material upload completed');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'update material' })
  @ApiResponse({
    status: 201,
    description: 'Material update successfully',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Material already exists' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.updated_by_id = user.userId;
    dto.updated_at = new Date();
    const result = await this.materialService.update(
      id,
      dto,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete material' })
  @ApiResponse({
    status: 200,
    description: 'Material delete successfully',
    type: BaseResponseDto,
  })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.materialService.remove(
      id,
      user.userId,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'delete material permanently' })
  async permanentRemove(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.materialService.permanentRemove(
      id,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'restore material' })
  async restore(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.materialService.restore(
      id,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Material restored successfully');
  }
}
