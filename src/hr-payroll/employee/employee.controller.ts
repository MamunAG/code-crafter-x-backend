import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
    async findAll(@Query() filters: FilterEmployeeDto, @Headers('x-organization-id') organizationId?: string) {
        const { page, limit, ...employeeFilters } = filters;
        const selectedOrganizationId = this.requireOrganizationId(organizationId);

        const result = await this.employeeService.findAll(
            { page, limit },
            employeeFilters,
            selectedOrganizationId,
        );

        return new BaseResponseDto(result, 'Employees retrieved successfully');
    }

    @Get(':id')
    @MenuAccess(MENU_NAME, 'canView')
    @ApiOperation({ summary: 'Get employee by id' })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.employeeService.findOne(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Employee retrieved successfully');
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
}