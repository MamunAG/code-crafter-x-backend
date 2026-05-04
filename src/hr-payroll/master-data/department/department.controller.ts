/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { BadRequestException, Body, Controller, Delete, Get, Header, Headers, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { DepartmentService } from './department.service';
import { FilterDepartmentDto } from './dto/filter-department.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

const MENU_NAME = 'Department Setup';

@ApiTags('Department')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/department')
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) { }

    private requireOrganizationId(organizationId?: string) {
        if (!organizationId?.trim()) {
            throw new BadRequestException('An organization is required to manage department records. Please select an organization and try again.');
        }

        return organizationId.trim();
    }

    @Get()
    @MenuAccess(MENU_NAME, 'canView')
    @ApiOperation({ summary: 'Get all departments' })
    async findAll(@Query() filters: FilterDepartmentDto, @Headers('x-organization-id') organizationId?: string) {
        const { page, limit, ...departmentFilters } = filters;
        const selectedOrganizationId = this.requireOrganizationId(organizationId);

        const result = await this.departmentService.findAll(
            { page, limit },
            departmentFilters,
            selectedOrganizationId,
        );

        return new BaseResponseDto(result, 'Departments retrieved successfully');
    }

    @Get('template/upload')
    @MenuAccess(MENU_NAME, 'canCreate')
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="department-upload-template.csv"')
    @ApiOperation({ summary: 'Download department upload template' })
    downloadUploadTemplate(@Headers('x-organization-id') organizationId?: string) {
        this.requireOrganizationId(organizationId);
        return this.departmentService.buildUploadTemplate();
    }

    @Get(':id')
    @MenuAccess(MENU_NAME, 'canView')
    @ApiOperation({ summary: 'Get department by id' })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.departmentService.findOne(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Department retrieved successfully');
    }

    @Post()
    @MenuAccess(MENU_NAME, 'canCreate')
    @ApiOperation({ summary: 'Create department' })
    async create(@CurrentUser() user: AuthUser, @Body() dto: CreateDepartmentDto, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);

        dto.created_by_id = user.userId;
        dto.updated_by_id = null as unknown as string;
        dto.updated_at = null as unknown as Date;

        const result = await this.departmentService.create(dto, selectedOrganizationId);
        return new BaseResponseDto(result, 'Department saved successfully');
    }

    @Post('upload')
    @MenuAccess(MENU_NAME, 'canCreate')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload department template' })
    async uploadTemplate(
        @CurrentUser() user: AuthUser,
        @UploadedFile() file: Express.Multer.File,
        @Headers('x-organization-id') organizationId?: string,
    ) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.departmentService.importFromTemplate(file, user.userId, selectedOrganizationId);
        return new BaseResponseDto(result, 'Department upload completed');
    }

    @Patch(':id')
    @MenuAccess(MENU_NAME, 'canUpdate')
    @ApiOperation({ summary: 'Update department' })
    async update(
        @CurrentUser() user: AuthUser,
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateDepartmentDto,
        @Headers('x-organization-id') organizationId?: string,
    ) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);

        dto.updated_by_id = user.userId;
        dto.updated_at = new Date();

        const result = await this.departmentService.update(id, dto, selectedOrganizationId);
        return new BaseResponseDto(result, 'Department updated successfully');
    }

    @Delete(':id')
    @MenuAccess(MENU_NAME, 'canDelete')
    @ApiOperation({ summary: 'Soft delete department' })
    async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.departmentService.remove(id, user.userId, selectedOrganizationId);
        return new BaseResponseDto(result, 'Department deleted successfully');
    }

    @Delete(':id/permanent')
    @MenuAccess(MENU_NAME, 'canDelete')
    @ApiOperation({ summary: 'Delete department permanently' })
    async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.departmentService.permanentRemove(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Department deleted permanently');
    }

    @Post(':id/restore')
    @MenuAccess(MENU_NAME, 'canUpdate')
    @ApiOperation({ summary: 'Restore department' })
    async restore(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.departmentService.restore(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Department restored successfully');
    }
}
