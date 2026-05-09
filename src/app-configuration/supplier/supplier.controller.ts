import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  Param,
  ParseUUIDPipe,
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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { FilterSupplierDto } from './dto/filter-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierService } from './supplier.service';

const MENU_NAME = 'Supplier Entry';

@ApiTags('Supplier')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/supplier')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  private requireOrganizationId(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException(
        'An organization is required to manage supplier records. Please select an organization and try again.',
      );
    }

    return organizationId.trim();
  }

  @Get()
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({ summary: 'Get all', description: 'Retrieve all suppliers' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async findAll(
    @Query() filters: FilterSupplierDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const { page, limit, ...supplierFilters } = filters;
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const suppliers = await this.supplierService.findAll(
      { page, limit },
      supplierFilters,
      selectedOrganizationId,
    );
    return new BaseResponseDto(suppliers, 'Suppliers retrieved successfully');
  }

  @Get('template/upload')
  @MenuAccess(MENU_NAME, 'canCreate')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="supplier-upload-template.csv"')
  @ApiOperation({ summary: 'Download supplier upload template' })
  downloadUploadTemplate(@Headers('x-organization-id') organizationId?: string) {
    this.requireOrganizationId(organizationId);
    return this.supplierService.buildUploadTemplate();
  }

  @Get(':id')
  @MenuAccess(MENU_NAME, 'canView')
  @ApiOperation({
    summary: 'Get by id',
    description: 'Retrieve specific supplier',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const supplier = await this.supplierService.findOne(
      id,
      selectedOrganizationId,
    );
    return new BaseResponseDto(supplier, 'Supplier retrieved successfully');
  }

  @Post()
  @MenuAccess(MENU_NAME, 'canCreate')
  @ApiOperation({ summary: 'Save supplier' })
  @ApiResponse({
    status: 201,
    description: 'Supplier saved successfully',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Supplier already exists' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSupplierDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.created_by_id = user.userId;
    dto.updated_by_id = null as unknown as string;
    dto.updated_at = null as unknown as Date;
    const result = await this.supplierService.create(
      dto,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Supplier saved successfully');
  }

  @Post('upload')
  @MenuAccess(MENU_NAME, 'canCreate')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload supplier template' })
  async uploadTemplate(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.supplierService.importFromTemplate(
      file,
      user.userId,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Supplier upload completed');
  }

  @Patch(':id')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Update supplier' })
  @ApiResponse({
    status: 201,
    description: 'Supplier update successfully',
    type: BaseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Supplier already exists' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSupplierDto,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    dto.updated_by_id = user.userId;
    dto.updated_at = new Date();
    const result = await this.supplierService.update(
      id,
      dto,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Supplier updated successfully');
  }

  @Delete(':id')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete supplier' })
  @ApiResponse({
    status: 200,
    description: 'Supplier delete successfully',
    type: BaseResponseDto,
  })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.supplierService.remove(
      id,
      user.userId,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Supplier deleted successfully');
  }

  @Delete(':id/permanent')
  @MenuAccess(MENU_NAME, 'canDelete')
  @ApiOperation({ summary: 'Delete supplier permanently' })
  async permanentRemove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.supplierService.permanentRemove(
      id,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Supplier deleted permanently');
  }

  @Post(':id/restore')
  @MenuAccess(MENU_NAME, 'canUpdate')
  @ApiOperation({ summary: 'Restore supplier' })
  async restore(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('x-organization-id') organizationId?: string,
  ) {
    const selectedOrganizationId = this.requireOrganizationId(organizationId);
    const result = await this.supplierService.restore(
      id,
      selectedOrganizationId,
    );
    return new BaseResponseDto(result, 'Supplier restored successfully');
  }
}
