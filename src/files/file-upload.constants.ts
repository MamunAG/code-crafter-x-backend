import { FileType } from './entities/file.entity';

export const FILE_UPLOAD_MAX_SIZE_BY_TYPE: Record<FileType, number> = {
  [FileType.PHOTO]: 5 * 1024 * 1024,
  [FileType.VIDEO]: 100 * 1024 * 1024,
  [FileType.AUDIO]: 30 * 1024 * 1024,
  [FileType.DOCUMENT]: 20 * 1024 * 1024,
  [FileType.RECEIPT]: 20 * 1024 * 1024,
  [FileType.OTHER]: 50 * 1024 * 1024,
};

export const FILE_UPLOAD_MAX_SIZE_BYTES = Math.max(
  ...Object.values(FILE_UPLOAD_MAX_SIZE_BY_TYPE),
);
