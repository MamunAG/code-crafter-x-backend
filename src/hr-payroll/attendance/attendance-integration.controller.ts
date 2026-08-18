import { BadRequestException, Body, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from 'src/common/decorators/public.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { IngestAttendanceDto } from './dto/ingest-attendance.dto';
import { AttendanceService } from './attendance.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Attendance Integration')
@ApiSecurity('attendance-key')
@Controller('api/v1/hr/integrations/attendance')
export class AttendanceIntegrationController {
  constructor(private readonly workforce: AttendanceService) {}
  @Public() @Post('punches') @HttpCode(202)
  @ApiHeader({ name: 'x-organization-id', required: true }) @ApiHeader({ name: 'x-attendance-key', required: true })
  async ingest(@Headers('x-organization-id') organization: string, @Headers('x-attendance-key') secret: string | undefined, @Req() request: Request, @Body() dto: IngestAttendanceDto) {
    const selectedOrganization = organizationId(organization);
    await this.workforce.authenticateIntegration(selectedOrganization, dto.source, secret, request.ip);
    return new BaseResponseDto(await this.workforce.ingest(selectedOrganization, dto), 'Attendance punches accepted');
  }
}
