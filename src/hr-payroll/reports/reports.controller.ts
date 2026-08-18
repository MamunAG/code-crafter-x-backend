import { BadRequestException, Controller, Get, Headers, Param, ParseUUIDPipe, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { ReportQueryDto } from './dto/report-query.dto';
import { GeneratedReport, HrReportService } from './report.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Reports and Payslips')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr')
export class ReportsController {
  constructor(private readonly reports: HrReportService) {}
  @Get('reports/:type') @MenuAccess('HR Reports', 'canView')
  async report(@Headers('x-organization-id') organization: string, @Param('type') type: string, @Query() query: ReportQueryDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.reports.report(organizationId(organization), type, query);
    if (this.generated(result)) { response.setHeader('Content-Type', result.contentType); response.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`); return result.buffer; }
    return new BaseResponseDto(result);
  }
  @Get('payslips/run/:runId') @MenuAccess('HR Reports', 'canView')
  async bulkPayslips(@Headers('x-organization-id') organization: string, @Param('runId', ParseUUIDPipe) runId: string, @Query('language') language: 'en' | 'bn' = 'en', @Res({ passthrough: true }) response: Response) {
    const result = await this.reports.bulkPayslips(organizationId(organization), runId, language); response.setHeader('Content-Type', result.contentType); response.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`); return result.buffer;
  }
  @Get('payslips/:payrollEmployeeId') @MenuAccess('HR Reports', 'canView')
  async payslip(@Headers('x-organization-id') organization: string, @Param('payrollEmployeeId', ParseUUIDPipe) id: string, @Query('language') language: 'en' | 'bn' = 'en', @Res({ passthrough: true }) response: Response) {
    const result = await this.reports.payslip(organizationId(organization), id, language); response.setHeader('Content-Type', result.contentType); response.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`); return result.buffer;
  }
  private generated(value: unknown): value is GeneratedReport { return Boolean(value && typeof value === 'object' && 'buffer' in value && 'contentType' in value); }
}
