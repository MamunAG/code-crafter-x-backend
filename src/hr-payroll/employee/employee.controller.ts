import { BadRequestException, Body, Controller, Delete, Get, Header, Headers, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { FilterEmployeeDto } from './dto/filter-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeService } from './employee.service';

const MENU_NAME = 'Employee Setup';

@ApiTags('Employee')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/employee')
export class EmployeeController {
    constructor(private readonly employeeService: EmployeeService) { }

    private requireOrganizationId(organizationId?: string) {
        if (!organizationId?.trim()) {
            throw new BadRequestException('An organization is required to manage employee records. Please select an organization and try again.');
        }

        return organizationId.trim();
    }

    @Get()
    @MenuAccess(MENU_NAME, 'canView')
    @ApiOperation({ summary: 'Get all employees' })
    async findAll(@CurrentUser() user: AuthUser, @Query() filters: FilterEmployeeDto, @Headers('x-organization-id') organizationId?: string) {
        const { page, limit, ...employeeFilters } = filters;
        const selectedOrganizationId = this.requireOrganizationId(organizationId);

        const result = await this.employeeService.findAll(
            { page, limit },
            employeeFilters,
            selectedOrganizationId,
        );

        if (user.role === RolesEnum.admin) await this.employeeService.auditPiiAccess(selectedOrganizationId, user.userId, 'LIST', { count: result.items.length });

        return new BaseResponseDto(this.protectPii(result, user.role === RolesEnum.admin), 'Employees retrieved successfully');
    }

    @Get('template/upload')
    @MenuAccess(MENU_NAME, 'canCreate')
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="employee-upload-template.csv"')
    @ApiOperation({ summary: 'Download employee upload template' })
    downloadUploadTemplate(@Headers('x-organization-id') organizationId?: string) {
        this.requireOrganizationId(organizationId);
        return this.employeeService.buildUploadTemplate();
    }

    @Get(':id')
    @MenuAccess(MENU_NAME, 'canView')
    @ApiOperation({ summary: 'Get employee by id' })
    async findOne(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.employeeService.findOne(id, selectedOrganizationId);
        if (user.role === RolesEnum.admin) await this.employeeService.auditPiiAccess(selectedOrganizationId, user.userId, id);
        return new BaseResponseDto(this.protectPii(result, user.role === RolesEnum.admin), 'Employee retrieved successfully');
    }

    @Post()
    @MenuAccess(MENU_NAME, 'canCreate')
    @ApiOperation({ summary: 'Create employee' })
    @ApiResponse({ status: 201, description: 'Employee saved successfully', type: BaseResponseDto })
    async create(@CurrentUser() user: AuthUser, @Body() dto: CreateEmployeeDto, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);

        dto.created_by_id = user.userId;
        dto.updated_by_id = null as unknown as string;
        dto.updated_at = null as unknown as Date;

        const result = await this.employeeService.create(dto, selectedOrganizationId);
        return new BaseResponseDto(result, 'Employee saved successfully');
    }

    @Post('upload')
    @MenuAccess(MENU_NAME, 'canCreate')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload employee template' })
    async uploadTemplate(
        @CurrentUser() user: AuthUser,
        @UploadedFile() file: Express.Multer.File,
        @Headers('x-organization-id') organizationId?: string,
    ) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.employeeService.importFromTemplate(file, user.userId, selectedOrganizationId);
        return new BaseResponseDto(result, 'Employee upload completed');
    }

    @Patch(':id')
    @MenuAccess(MENU_NAME, 'canUpdate')
    @ApiOperation({ summary: 'Update employee' })
    async update(
        @CurrentUser() user: AuthUser,
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateEmployeeDto,
        @Headers('x-organization-id') organizationId?: string,
    ) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);

        dto.updated_by_id = user.userId;
        dto.updated_at = new Date();

        const result = await this.employeeService.update(id, dto, selectedOrganizationId);
        return new BaseResponseDto(result, 'Employee updated successfully');
    }

    @Delete(':id')
    @MenuAccess(MENU_NAME, 'canDelete')
    @ApiOperation({ summary: 'Soft delete employee' })
    async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.employeeService.remove(id, user.userId, selectedOrganizationId);
        return new BaseResponseDto(result, 'Employee deleted successfully');
    }

    @Delete(':id/permanent')
    @MenuAccess(MENU_NAME, 'canDelete')
    @ApiOperation({ summary: 'Delete employee permanently' })
    async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.employeeService.permanentRemove(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Employee deleted permanently');
    }

    @Post(':id/restore')
    @MenuAccess(MENU_NAME, 'canUpdate')
    @ApiOperation({ summary: 'Restore employee' })
    async restore(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.employeeService.restore(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Employee restored successfully');
    }

    private protectPii<T>(value: T, canViewPii: boolean): T {
        if (canViewPii) return value;
        const clone = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
        const maskRecord = (record: Record<string, unknown>) => {
            for (const field of ['nidNo', 'taxIdentifier', 'bankDetails', 'emergencyContact']) {
                const raw = record[field];
                if (typeof raw === 'string' && raw) record[field] = raw.length <= 4 ? '****' : `${'*'.repeat(Math.min(12, raw.length - 4))}${raw.slice(-4)}`;
            }
            const profile = record.profile;
            if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
                const details = profile as Record<string, unknown>;
                const rules = details.rules;
                if (rules && typeof rules === 'object' && !Array.isArray(rules)) {
                    const ruleRecord = rules as Record<string, unknown>;
                    if (typeof ruleRecord.bankAccountNo === 'string' && ruleRecord.bankAccountNo) {
                        ruleRecord.bankAccountNo = `****${ruleRecord.bankAccountNo.slice(-4)}`;
                    }
                }
                if (Array.isArray(details.nominees)) {
                    const nominees = details.nominees as unknown[];
                    details.nominees = nominees.map((nominee): unknown => {
                        if (!nominee || typeof nominee !== 'object' || Array.isArray(nominee)) return nominee;
                        const masked = nominee as Record<string, unknown>;
                        if (typeof masked.nidNo === 'string' && masked.nidNo) masked.nidNo = `****${masked.nidNo.slice(-4)}`;
                        return masked;
                    });
                }
            }
            return record;
        };
        const data = clone as { items?: Array<Record<string, unknown>> };
        if (Array.isArray(data.items)) data.items = data.items.map(maskRecord);
        else maskRecord(clone);
        return clone as T;
    }
}
