import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { FilterFilesDto } from './dto/filter-files.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FILE_UPLOAD_MAX_SIZE_BY_TYPE } from './file-upload.constants';
import { FileReference } from './entities/file-reference.entity';
import { FileCategory, FileType, Files } from './entities/file.entity';

@Injectable()
export class FilesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Files)
    private readonly filesRepository: Repository<Files>,

    @InjectRepository(FileReference)
    private readonly fileReferenceRepository: Repository<FileReference>,
  ) {}

  async create(createFileDto: CreateFileDto, uploadedBy?: string) {
    const file = this.filesRepository.create({
      ...createFileDto,
      ...(uploadedBy ? { uploaded_by: uploadedBy } : {}),
    });

    const saved = await this.filesRepository.save(file);
    return this.toResponse(saved, 'File created successfully');
  }

  async upload(
    file: Express.Multer.File,
    uploadedBy?: string,
    fileType: FileType = FileType.PHOTO,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const maxSize = FILE_UPLOAD_MAX_SIZE_BY_TYPE[fileType];

    if (!maxSize) {
      throw new BadRequestException(`Unsupported file type: ${fileType}`);
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File is too large. Maximum allowed size for ${fileType} is ${this.humanizeBytes(maxSize)}.`,
      );
    }

    const cloudinaryFile = await this.uploadToCloudinary(file);
    const normalizedFormat = cloudinaryFile.format.toLowerCase();
    const normalizedMimeType =
      normalizedFormat === 'jpg' || normalizedFormat === 'jpeg'
        ? 'image/jpeg'
        : `image/${normalizedFormat}`;

    const createFileDto: CreateFileDto = {
      file_name: `${cloudinaryFile.public_id.replace(/\//g, '_')}.${normalizedFormat}`,
      original_name: cloudinaryFile.original_filename || file.originalname,
      file_path: cloudinaryFile.secure_url,
      file_size: Number(cloudinaryFile.bytes ?? file.size),
      mime_type: cloudinaryFile.resource_type === 'image'
        ? normalizedMimeType
        : file.mimetype,
      file_type: fileType,
      file_category: FileCategory.PERSONAL,
      public_url: cloudinaryFile.secure_url,
    };

    return this.create(createFileDto, uploadedBy);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterFilesDto>,
  ): Promise<PaginatedResponseDto<FileResponseDto>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.filesRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.uploadedBy', 'uploadedBy')
      .skip(skip)
      .take(limit)
      .orderBy('file.uploaded_at', 'DESC');

    if (filters?.file_name) {
      queryBuilder.andWhere('file.file_name ILIKE :file_name', {
        file_name: `%${filters.file_name}%`,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(file.file_name ILIKE :search OR file.original_name ILIKE :search OR file.public_url ILIKE :search)',
        {
          search: `%${filters.search}%`,
        },
      );
    }

    if (filters?.file_type) {
      queryBuilder.andWhere('file.file_type = :file_type', {
        file_type: filters.file_type,
      });
    }

    if (filters?.file_category) {
      queryBuilder.andWhere('file.file_category = :file_category', {
        file_category: filters.file_category,
      });
    }

    if (filters?.public_url) {
      queryBuilder.andWhere('file.public_url ILIKE :public_url', {
        public_url: `%${filters.public_url}%`,
      });
    }

    if (filters?.uploaded_by) {
      queryBuilder.andWhere('file.uploaded_by = :uploaded_by', {
        uploaded_by: filters.uploaded_by,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((file) => this.toResponse(file)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number) {
    const file = await this.filesRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
      withDeleted: false,
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return this.toResponse(file);
  }

  async update(id: number, updateFileDto: UpdateFileDto) {
    const file = await this.filesRepository.findOne({
      where: { id },
      relations: ['uploadedBy'],
      withDeleted: false,
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    Object.assign(file, updateFileDto);
    const saved = await this.filesRepository.save(file);
    return this.toResponse(saved, 'File updated successfully');
  }

  async remove(id: number) {
    const result = await this.filesRepository.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException('File not found');
    }

    return result;
  }

  async permanentRemove(id: number) {
    const result = await this.filesRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException('File not found');
    }

    return result;
  }

  async restore(id: number) {
    const result = await this.filesRepository.restore(id);

    if (!result.affected) {
      throw new NotFoundException('File not found');
    }

    return result;
  }

  async createReference(fileId: number, resource: string, resourceId: number, referenceType: string) {
    const file = await this.filesRepository.findOne({
      where: { id: fileId },
      withDeleted: false,
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const reference = this.fileReferenceRepository.create({
      file_id: fileId,
      resource,
      resource_id: resourceId,
      reference_type: referenceType,
    });

    return this.fileReferenceRepository.save(reference);
  }

  private toResponse(file: Files, message?: string): FileResponseDto {
    return {
      success: true,
      file_id: file.id,
      file_url: file.public_url ?? file.file_path,
      thumbnail_url: undefined,
      original_name: file.original_name,
      file_name: file.file_name,
      file_size: Number(file.file_size),
      mime_type: file.mime_type,
      file_type: file.file_type,
      file_category: file.file_category,
      message,
      public_url: file.public_url,
      uploaded_by: file.uploaded_by,
      uploaded_at: file.uploaded_at,
      updated_at: file.updated_at,
      deleted_at: file.deleted_at,
    };
  }

  private async uploadToCloudinary(file: Express.Multer.File) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');
    const folder = this.configService.get<string>('CLOUDINARY_FOLDER')?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary credentials are not configured on the backend.',
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign: Record<string, string> = {
      timestamp: String(timestamp),
    };

    if (folder) {
      paramsToSign.folder = folder;
    }

    const signature = this.createCloudinarySignature(paramsToSign, apiSecret);
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      file.originalname,
    );
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);

    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    const payload = (await response.json()) as {
      secure_url?: string;
      public_id?: string;
      bytes?: number | string;
      format?: string;
      original_filename?: string;
      resource_type?: string;
      error?: {
        message?: string;
      };
    };

    if (!response.ok) {
      throw new InternalServerErrorException(
        payload?.error?.message || 'Cloudinary upload failed',
      );
    }

    if (!payload?.secure_url || !payload?.public_id || !payload?.format) {
      throw new InternalServerErrorException(
        'Cloudinary did not return the expected upload details.',
      );
    }

    return {
      secure_url: payload.secure_url,
      public_id: payload.public_id,
      bytes: Number(payload.bytes ?? file.size),
      format: payload.format,
      original_filename: payload.original_filename || file.originalname,
      resource_type: payload.resource_type || 'image',
    };
  }

  private createCloudinarySignature(
    paramsToSign: Record<string, string>,
    apiSecret: string,
  ) {
    const serialized = Object.entries(paramsToSign)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    return createHash('sha1').update(`${serialized}${apiSecret}`).digest('hex');
  }

  private humanizeBytes(bytes: number) {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
    }

    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }

    return `${bytes} bytes`;
  }
}
