import { BadRequestException, Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

function organizationId(value?: string) {
  if (!value?.trim())
    throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
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
}
