import { BadRequestException, Controller, Get, Headers, Param, ParseUUIDPipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { MenuAccess } from 'src/common/decorators/menu-access.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { HrImportService } from './import.service';

function organizationId(value?: string) {
  if (!value?.trim()) throw new BadRequestException('x-organization-id header is required.');
  return value.trim();
}

@ApiTags('HR Imports')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/hr/imports')
export class ImportsController {
  constructor(private readonly imports: HrImportService) {}
  @Post(':type') @MenuAccess('HR Imports', 'canCreate') @UseInterceptors(FileInterceptor('file')) @ApiConsumes('multipart/form-data')
  async queue(@Headers('x-organization-id') organization: string, @CurrentUser() user: AuthUser, @Param('type') type: string, @UploadedFile() file?: Express.Multer.File) {
    return new BaseResponseDto(await this.imports.queue(organizationId(organization), user.userId, type, file), 'HR import queued');
  }
  @Get('jobs/:id') @MenuAccess('HR Imports', 'canView')
  async status(@Headers('x-organization-id') organization: string, @Param('id', ParseUUIDPipe) id: string) { return new BaseResponseDto(await this.imports.status(organizationId(organization), id)); }
}
