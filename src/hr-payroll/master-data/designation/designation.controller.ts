import { BadRequestException, Body, Controller, Delete, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { FilterDesignationDto } from './dto/filter-designation.dto';
import { DesignationService } from './designation.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';

const MENU_NAME = 'Designation Setup';

@ApiTags('Designation')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/designation')
export class DesignationController {
    constructor(private readonly designationService: DesignationService) { }

    private requireOrganizationId(organizationId?: string) {
        if (!organizationId?.trim()) {
            throw new BadRequestException('An organization is required to manage designation records. Please select an organization and try again.');
        }

        return organizationId.trim();
    }

    @Get()
    @MenuAccess(MENU_NAME, 'canView')
    @ApiOperation({ summary: 'Get all designations' })
    async findAll(@Query() filters: FilterDesignationDto, @Headers('x-organization-id') organizationId?: string) {
        const { page, limit, ...designationFilters } = filters;
        const selectedOrganizationId = this.requireOrganizationId(organizationId);

        const result = await this.designationService.findAll(
            { page, limit },
            designationFilters,
            selectedOrganizationId,
        );

        return new BaseResponseDto(result, 'Designations retrieved successfully');
    }

    @Get(':id')
    @MenuAccess(MENU_NAME, 'canView')
    @ApiOperation({ summary: 'Get designation by id' })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.designationService.findOne(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Designation retrieved successfully');
    }

    @Post()
    @MenuAccess(MENU_NAME, 'canCreate')
    @ApiOperation({ summary: 'Create designation' })
    async create(@CurrentUser() user: AuthUser, @Body() dto: CreateDesignationDto, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);

        dto.created_by_id = user.userId;
        dto.updated_by_id = null as unknown as string;
        dto.updated_at = null as unknown as Date;

        const result = await this.designationService.create(dto, selectedOrganizationId);
        return new BaseResponseDto(result, 'Designation saved successfully');
    }

    @Patch(':id')
    @MenuAccess(MENU_NAME, 'canUpdate')
    @ApiOperation({ summary: 'Update designation' })
    async update(
        @CurrentUser() user: AuthUser,
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateDesignationDto,
        @Headers('x-organization-id') organizationId?: string,
    ) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);

        dto.updated_by_id = user.userId;
        dto.updated_at = new Date();

        const result = await this.designationService.update(id, dto, selectedOrganizationId);
        return new BaseResponseDto(result, 'Designation updated successfully');
    }

    @Delete(':id')
    @MenuAccess(MENU_NAME, 'canDelete')
    @ApiOperation({ summary: 'Soft delete designation' })
    async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.designationService.remove(id, user.userId, selectedOrganizationId);
        return new BaseResponseDto(result, 'Designation deleted successfully');
    }

    @Delete(':id/permanent')
    @MenuAccess(MENU_NAME, 'canDelete')
    @ApiOperation({ summary: 'Delete designation permanently' })
    async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.designationService.permanentRemove(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Designation deleted permanently');
    }

    @Post(':id/restore')
    @MenuAccess(MENU_NAME, 'canUpdate')
    @ApiOperation({ summary: 'Restore designation' })
    async restore(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.designationService.restore(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Designation restored successfully');
    }
}