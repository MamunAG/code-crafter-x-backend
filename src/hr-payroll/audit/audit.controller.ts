import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { AuditService } from './audit.service';
import { AuditModuleName } from './audit.types';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditModuleScopeDto } from './dto/audit-module-scope.dto';
import { DeleteAuditLogsDto } from './dto/delete-audit-logs.dto';

function organizationId(value?: string) {
  if (!value?.trim())
    throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('Audit Log')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/audit-log')
export class SharedAuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  async list(
    @Headers('x-organization-id') organization: string,
    @Query() query: AuditLogQueryDto,
  ) {
    return new BaseResponseDto(
      await this.audit.listRecent(
        organizationId(organization),
        query,
        query.moduleName ?? null,
      ),
    );
  }

  @Delete('selected')
  @Roles(RolesEnum.admin)
  async deleteSelected(
    @Headers('x-organization-id') organization: string,
    @Query() scope: AuditModuleScopeDto,
    @Body() dto: DeleteAuditLogsDto,
  ) {
    return new BaseResponseDto(
      await this.audit.deleteSelected(
        organizationId(organization),
        dto.ids,
        scope.moduleName ?? null,
      ),
      'Selected audit logs permanently deleted successfully.',
    );
  }

  @Delete('all')
  @Roles(RolesEnum.admin)
  async deleteAll(
    @Headers('x-organization-id') organization: string,
    @Query() scope: AuditModuleScopeDto,
  ) {
    return new BaseResponseDto(
      await this.audit.deleteAll(
        organizationId(organization),
        scope.moduleName ?? null,
      ),
      'Audit logs permanently deleted successfully.',
    );
  }
}

@ApiTags('HR Audit Log')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/audit-log')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @MenuAccess('HR Audit Log', 'canView')
  async list(
    @Headers('x-organization-id') organization: string,
    @Query() query: AuditLogQueryDto,
  ) {
    return new BaseResponseDto(
      await this.audit.listRecent(organizationId(organization), query),
    );
  }

  @Delete('selected')
  @Roles(RolesEnum.admin)
  @MenuAccess('HR Audit Log', 'canDelete')
  async deleteSelected(
    @Headers('x-organization-id') organization: string,
    @Body() dto: DeleteAuditLogsDto,
  ) {
    return new BaseResponseDto(
      await this.audit.deleteSelected(organizationId(organization), dto.ids),
      'Selected HR audit logs permanently deleted successfully.',
    );
  }

  @Delete('all')
  @Roles(RolesEnum.admin)
  @MenuAccess('HR Audit Log', 'canDelete')
  async deleteAll(@Headers('x-organization-id') organization: string) {
    return new BaseResponseDto(
      await this.audit.deleteAll(organizationId(organization)),
      'All HR audit logs permanently deleted successfully.',
    );
  }
}

@ApiTags('Merchandising Audit Log')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/merchandising/audit-log')
export class MerchandisingAuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @MenuAccess('Merchandising Audit Log', 'canView')
  async list(
    @Headers('x-organization-id') organization: string,
    @Query() query: AuditLogQueryDto,
  ) {
    return new BaseResponseDto(
      await this.audit.listRecent(
        organizationId(organization),
        query,
        AuditModuleName.Merchandising,
      ),
    );
  }

  @Delete('selected')
  @Roles(RolesEnum.admin)
  @MenuAccess('Merchandising Audit Log', 'canDelete')
  async deleteSelected(
    @Headers('x-organization-id') organization: string,
    @Body() dto: DeleteAuditLogsDto,
  ) {
    return new BaseResponseDto(
      await this.audit.deleteSelected(
        organizationId(organization),
        dto.ids,
        AuditModuleName.Merchandising,
      ),
      'Selected merchandising audit logs permanently deleted successfully.',
    );
  }

  @Delete('all')
  @Roles(RolesEnum.admin)
  @MenuAccess('Merchandising Audit Log', 'canDelete')
  async deleteAll(@Headers('x-organization-id') organization: string) {
    return new BaseResponseDto(
      await this.audit.deleteAll(
        organizationId(organization),
        AuditModuleName.Merchandising,
      ),
      'All merchandising audit logs permanently deleted successfully.',
    );
  }
}

@ApiTags('IAM Audit Log')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/iam/audit-log')
export class IamAuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @MenuAccess('IAM Audit Log', 'canView')
  async list(
    @Headers('x-organization-id') organization: string,
    @Query() query: AuditLogQueryDto,
  ) {
    return new BaseResponseDto(
      await this.audit.listRecent(organizationId(organization), query, null),
    );
  }

  @Delete('selected')
  @Roles(RolesEnum.admin)
  @MenuAccess('IAM Audit Log', 'canDelete')
  async deleteSelected(
    @Headers('x-organization-id') organization: string,
    @Body() dto: DeleteAuditLogsDto,
  ) {
    return new BaseResponseDto(
      await this.audit.deleteSelected(
        organizationId(organization),
        dto.ids,
        null,
      ),
      'Selected organization audit logs permanently deleted successfully.',
    );
  }

  @Delete('all')
  @Roles(RolesEnum.admin)
  @MenuAccess('IAM Audit Log', 'canDelete')
  async deleteAll(@Headers('x-organization-id') organization: string) {
    return new BaseResponseDto(
      await this.audit.deleteAll(organizationId(organization), null),
      'All organization audit logs permanently deleted successfully.',
    );
  }
}
