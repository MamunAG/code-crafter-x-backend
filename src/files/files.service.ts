import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { FilterFilesDto } from './dto/filter-files.dto';
import { FileResponseDto } from './dto/file-response.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileReference } from './entities/file-reference.entity';
import { Files } from './entities/file.entity';

@Injectable()
export class FilesService {
  constructor(
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
}
