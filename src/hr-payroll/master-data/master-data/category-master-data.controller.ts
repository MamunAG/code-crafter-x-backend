import { BadRequestException, Body, Controller, Delete, Get, Header, Headers, Param, ParseUUIDPipe, Patch, Post, Query, Type, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExtraModels, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { TenantPaginationDto } from '../../common/dto/tenant-pagination.dto';
import { HrMasterDataType } from '../../common/hr.enums';
import { CreateCategoryMasterDataDto, MasterDataUploadDto, UpdateCategoryMasterDataDto } from './dto/category-master-data.dto';
import { EmploymentTypeSettingsDto, GradeSettingsDto, HolidayCalendarSettingsDto, LeaveTypeSettingsDto, PayGroupSettingsDto, SalaryComponentSettingsDto, SeparationReasonSettingsDto, WorkLocationSettingsDto } from './dto/master-data-settings.dto';
import { MasterDataService } from './master-data.service';

type CategoryConfig = { type: HrMasterDataType; path: string; menuName: string; label: string; fileName: string; settingsModel: Type<unknown> };

function requireOrganizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('An organization is required to manage HR master data. Please select an organization and try again.');
  return value.trim();
}

function createCategoryController(config: CategoryConfig): Type<unknown> {
  @ApiTags(config.label)
  @ApiBearerAuth()
  @ApiExtraModels(CreateCategoryMasterDataDto, config.settingsModel)
  @Roles(RolesEnum.admin, RolesEnum.user)
  @Controller(`api/v1/hr/master-data/${config.path}`)
  class CategoryMasterDataController {
    constructor(readonly service: MasterDataService) {}

    @Get()
    @MenuAccess(config.menuName, 'canView')
    @ApiOperation({ summary: `List ${config.label.toLowerCase()}` })
    async list(@Headers('x-organization-id') organization: string | undefined, @Query() query: TenantPaginationDto) {
      return new BaseResponseDto(await this.service.list(requireOrganizationId(organization), config.type, query), `${config.label} retrieved successfully`);
    }

    @Get('template/upload')
    @MenuAccess(config.menuName, 'canCreate')
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', `attachment; filename="${config.fileName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, '')}-upload-template.csv"`)
    @ApiOperation({ summary: `Download ${config.label.toLowerCase()} CSV template` })
    template(@Headers('x-organization-id') organization: string | undefined) {
      requireOrganizationId(organization);
      return this.service.buildUploadTemplate(config.type);
    }

    @Post('upload')
    @MenuAccess(config.menuName, 'canCreate')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: MasterDataUploadDto })
    @ApiOperation({ summary: `Upload ${config.label.toLowerCase()} CSV` })
    async upload(@Headers('x-organization-id') organization: string | undefined, @CurrentUser() user: AuthUser, @UploadedFile() file?: Express.Multer.File) {
      return new BaseResponseDto(await this.service.importFromTemplate(requireOrganizationId(organization), user.userId, config.type, file), `${config.label} upload completed`);
    }

    @Get(':id')
    @MenuAccess(config.menuName, 'canView')
    async findOne(@Headers('x-organization-id') organization: string | undefined, @Param('id', ParseUUIDPipe) id: string) {
      return new BaseResponseDto(await this.service.findOne(requireOrganizationId(organization), id, config.type), `${config.label} retrieved successfully`);
    }

    @Post()
    @MenuAccess(config.menuName, 'canCreate')
    @ApiBody({ schema: { allOf: [{ $ref: getSchemaPath(CreateCategoryMasterDataDto) }, { properties: { settings: { $ref: getSchemaPath(config.settingsModel) } } }] } })
    async create(@Headers('x-organization-id') organization: string | undefined, @CurrentUser() user: AuthUser, @Body() dto: CreateCategoryMasterDataDto) {
      return new BaseResponseDto(await this.service.createForType(requireOrganizationId(organization), user.userId, config.type, dto), `${config.label} saved successfully`);
    }

    @Patch(':id')
    @MenuAccess(config.menuName, 'canUpdate')
    async update(@Headers('x-organization-id') organization: string | undefined, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryMasterDataDto) {
      return new BaseResponseDto(await this.service.updateForType(requireOrganizationId(organization), user.userId, config.type, id, dto), `${config.label} updated successfully`);
    }

    @Delete(':id')
    @MenuAccess(config.menuName, 'canDelete')
    async remove(@Headers('x-organization-id') organization: string | undefined, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
      return new BaseResponseDto(await this.service.remove(requireOrganizationId(organization), user.userId, config.type, id), `${config.label} deleted successfully`);
    }

    @Post(':id/restore')
    @MenuAccess(config.menuName, 'canUpdate')
    async restore(@Headers('x-organization-id') organization: string | undefined, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
      return new BaseResponseDto(await this.service.restore(requireOrganizationId(organization), user.userId, config.type, id), `${config.label} restored successfully`);
    }

    @Delete(':id/permanent')
    @MenuAccess(config.menuName, 'canDelete')
    async permanentRemove(@Headers('x-organization-id') organization: string | undefined, @CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
      return new BaseResponseDto(await this.service.permanentRemove(requireOrganizationId(organization), user.userId, config.type, id), `${config.label} deleted permanently`);
    }
  }

  Object.defineProperty(CategoryMasterDataController, 'name', { value: `${config.fileName}Controller` });
  return CategoryMasterDataController;
}

export const EmploymentTypeController = createCategoryController({ type: HrMasterDataType.EmploymentType, path: 'employment-types', menuName: 'Employment Type Setup', label: 'Employment types', fileName: 'EmploymentType', settingsModel: EmploymentTypeSettingsDto });
export const GradeController = createCategoryController({ type: HrMasterDataType.Grade, path: 'grades', menuName: 'Grade Setup', label: 'Grades', fileName: 'Grade', settingsModel: GradeSettingsDto });
export const PayGroupController = createCategoryController({ type: HrMasterDataType.PayGroup, path: 'pay-groups', menuName: 'Pay Group Setup', label: 'Pay groups', fileName: 'PayGroup', settingsModel: PayGroupSettingsDto });
export const WorkLocationController = createCategoryController({ type: HrMasterDataType.WorkLocation, path: 'work-locations', menuName: 'Work Location Setup', label: 'Work locations', fileName: 'WorkLocation', settingsModel: WorkLocationSettingsDto });
export const HolidayCalendarController = createCategoryController({ type: HrMasterDataType.HolidayCalendar, path: 'holiday-calendars', menuName: 'Holiday Calendar Setup', label: 'Holiday calendars', fileName: 'HolidayCalendar', settingsModel: HolidayCalendarSettingsDto });
export const LeaveTypeController = createCategoryController({ type: HrMasterDataType.LeaveType, path: 'leave-types', menuName: 'Leave Type Setup', label: 'Leave types', fileName: 'LeaveType', settingsModel: LeaveTypeSettingsDto });
export const SalaryComponentController = createCategoryController({ type: HrMasterDataType.SalaryComponent, path: 'salary-components', menuName: 'Salary Component Setup', label: 'Salary components', fileName: 'SalaryComponent', settingsModel: SalaryComponentSettingsDto });
export const SeparationReasonController = createCategoryController({ type: HrMasterDataType.SeparationReason, path: 'separation-reasons', menuName: 'Separation Reason Setup', label: 'Separation reasons', fileName: 'SeparationReason', settingsModel: SeparationReasonSettingsDto });

export const CATEGORY_MASTER_DATA_CONTROLLERS = [EmploymentTypeController, GradeController, PayGroupController, WorkLocationController, HolidayCalendarController, LeaveTypeController, SalaryComponentController, SeparationReasonController];
