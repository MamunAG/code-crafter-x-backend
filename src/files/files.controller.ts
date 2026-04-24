import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  ParseFilePipeBuilder,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import type AuthUser from '../auth/dto/auth-user';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { RolesEnum } from '../common/enums/role.enum';
import { CreateFileDto } from './dto/create-file.dto';
import { FilterFilesDto } from './dto/filter-files.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FILE_UPLOAD_MAX_SIZE_BY_TYPE } from './file-upload.constants';
import { FileType } from './entities/file.entity';
import { FilesService } from './files.service';

const PROFILE_PHOTO_MAX_SIZE_BYTES =
  FILE_UPLOAD_MAX_SIZE_BY_TYPE[FileType.PHOTO];

@ApiTags('Files')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a file record' })
  @ApiResponse({ status: 201, description: 'File created successfully', type: BaseResponseDto<FileResponseDto> })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateFileDto) {
    const result = await this.filesService.create(dto, user.userId);
    return new BaseResponseDto(result, 'File created successfully');
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file, store it in Cloudinary, and save the file record' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully', type: BaseResponseDto<FileResponseDto> })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: PROFILE_PHOTO_MAX_SIZE_BYTES,
      },
    }),
  )
  async upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: PROFILE_PHOTO_MAX_SIZE_BYTES,
        })
        .addFileTypeValidator({
          fileType: /^image\/.*/i,
        })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.filesService.upload(file, user.userId, FileType.PHOTO);
    return new BaseResponseDto(result, 'File uploaded successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all files with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully', type: BaseResponseDto<PaginatedResponseDto<FileResponseDto>> })
  async findAll(@Query() filters: FilterFilesDto) {
    const { page, limit, ...fileFilters } = filters;
    const pagination = { page, limit };
    const files = await this.filesService.findAll(pagination, fileFilters);
    return new BaseResponseDto(files, 'Files retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a file by id' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully', type: BaseResponseDto<FileResponseDto> })
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    const file = await this.filesService.findOne(id);
    return new BaseResponseDto(file, 'File retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a file by id' })
  @ApiResponse({ status: 200, description: 'File updated successfully', type: BaseResponseDto<FileResponseDto> })
  async update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() dto: UpdateFileDto,
  ) {
    const file = await this.filesService.update(id, dto);
    return new BaseResponseDto(file, 'File updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a file by id' })
  async remove(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.filesService.remove(id);
    return new BaseResponseDto(result, 'File deleted successfully');
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete a file by id' })
  async permanentRemove(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.filesService.permanentRemove(id);
    return new BaseResponseDto(result, 'File deleted permanently');
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted file' })
  async restore(@Param('id', new ParseIntPipe()) id: number) {
    const result = await this.filesService.restore(id);
    return new BaseResponseDto(result, 'File restored successfully');
  }

  @Post(':id/references')
  @ApiOperation({ summary: 'Create a file reference' })
  async createReference(
    @Param('id', new ParseIntPipe()) id: number,
    @Body()
    body: {
      resource: string;
      resource_id: number;
      reference_type: string;
    },
  ) {
    const result = await this.filesService.createReference(
      id,
      body.resource,
      body.resource_id,
      body.reference_type,
    );
    return new BaseResponseDto(result, 'File reference created successfully');
  }
}
