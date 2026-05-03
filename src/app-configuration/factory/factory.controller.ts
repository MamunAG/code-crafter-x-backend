import { BadRequestException, Body, Controller, Delete, Get, Header, Headers, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { CreateFactoryDto } from './dto/create-factory.dto';
import { FilterFactoryDto } from './dto/filter-factory.dto';
import { UpdateFactoryDto } from './dto/update-factory.dto';
import { FactoryService } from './factory.service';

const MENU_NAME = 'Factory Setup';

@ApiTags('Factory')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/factory')
export class FactoryController {
    constructor(private readonly factoryService: FactoryService) { }

    private requireOrganizationId(organizationId?: string) {
        if (!organizationId?.trim()) {
            throw new BadRequestException('An organization is required to manage factory records. Please select an organization and try again.');
        }

        return organizationId.trim();
    }

    @Get()
    @MenuAccess(MENU_NAME, 'canView')
    @ApiOperation({ summary: 'Get all', description: 'Retrieve all factories' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
    async findAll(@Query() filters: FilterFactoryDto, @Headers('x-organization-id') organizationId?: string) {
        const { page, limit, ...factoryFilters } = filters;
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const factories = await this.factoryService.findAll({ page, limit }, factoryFilters, selectedOrganizationId);
        return new BaseResponseDto(factories, 'Factories retrieved successfully');
    }

    @Get('template/upload')
    @MenuAccess(MENU_NAME, 'canCreate')
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="factory-upload-template.csv"')
    @ApiOperation({ summary: 'Download factory upload template' })
    downloadUploadTemplate(@Headers('x-organization-id') organizationId?: string) {
        this.requireOrganizationId(organizationId);
        return this.factoryService.buildUploadTemplate();
    }

    @Get(':id')
    @MenuAccess(MENU_NAME, 'canView')
    @ApiOperation({ summary: 'Get by id', description: 'Retrieve specific factory' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const factory = await this.factoryService.findOne(id, selectedOrganizationId);
        return new BaseResponseDto(factory, 'Factory retrieved successfully');
    }

    @Post()
    @MenuAccess(MENU_NAME, 'canCreate')
    @ApiOperation({ summary: 'save factory' })
    @ApiResponse({ status: 201, description: 'Factory save successfully', type: BaseResponseDto })
    @ApiResponse({ status: 400, description: 'Factory already exists' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
    async create(@CurrentUser() user: AuthUser, @Body() dto: CreateFactoryDto, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        dto.created_by_id = user.userId;
        dto.updated_by_id = null as unknown as string;
        dto.updated_at = null as unknown as Date;
        const result = await this.factoryService.create(dto, selectedOrganizationId);
        return new BaseResponseDto(result, 'Factory saved successfully');
    }

    @Post('upload')
    @MenuAccess(MENU_NAME, 'canCreate')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload factory template' })
    async uploadTemplate(
        @CurrentUser() user: AuthUser,
        @UploadedFile() file: Express.Multer.File,
        @Headers('x-organization-id') organizationId?: string,
    ) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.factoryService.importFromTemplate(file, user.userId, selectedOrganizationId);
        return new BaseResponseDto(result, 'Factory upload completed');
    }

    @Patch(':id')
    @MenuAccess(MENU_NAME, 'canUpdate')
    @ApiOperation({ summary: 'update factory' })
    @ApiResponse({ status: 201, description: 'Factory update successfully', type: BaseResponseDto })
    @ApiResponse({ status: 400, description: 'Factory already exists' })
    @ApiResponse({ status: 401, description: 'Unauthorized - Authentication required' })
    async update(
        @CurrentUser() user: AuthUser,
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateFactoryDto,
        @Headers('x-organization-id') organizationId?: string,
    ) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        dto.updated_by_id = user.userId;
        dto.updated_at = new Date();
        const result = await this.factoryService.update(id, dto, selectedOrganizationId);
        return new BaseResponseDto(result, 'Factory updated successfully');
    }

    @Delete(':id')
    @MenuAccess(MENU_NAME, 'canDelete')
    @ApiOperation({ summary: 'delete factory' })
    @ApiResponse({ status: 200, description: 'Factory delete successfully', type: BaseResponseDto })
    async remove(@CurrentUser() user: AuthUser, @Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.factoryService.remove(id, user.userId, selectedOrganizationId);
        return new BaseResponseDto(result, 'Factory deleted successfully');
    }

    @Delete(':id/permanent')
    @MenuAccess(MENU_NAME, 'canDelete')
    @ApiOperation({ summary: 'delete factory permanently' })
    async permanentRemove(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.factoryService.permanentRemove(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Factory deleted permanently');
    }

    @Post(':id/restore')
    @MenuAccess(MENU_NAME, 'canUpdate')
    @ApiOperation({ summary: 'restore factory' })
    async restore(@Param('id', new ParseUUIDPipe()) id: string, @Headers('x-organization-id') organizationId?: string) {
        const selectedOrganizationId = this.requireOrganizationId(organizationId);
        const result = await this.factoryService.restore(id, selectedOrganizationId);
        return new BaseResponseDto(result, 'Factory restored successfully');
    }
}
