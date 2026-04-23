import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto<D = any> {
  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPreviousPage: boolean;

  @ApiProperty({
    description: 'Additional generic data',
    required: false,
  })
  othersDataSummary?: D;
}

export class PaginatedResponseDto<T, D = any> {
  @ApiProperty({
    description: 'Array of items for the current page',
    isArray: true,
  })
  items: T[];

  @ApiProperty({
    description: 'Pagination metadata with optional additional data',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto<D>;
}
