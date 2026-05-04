import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderType } from '../entity/job.entity';

export class FilterJobDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Factory ID' })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

  @ApiPropertyOptional({ description: 'Buyer ID' })
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @ApiPropertyOptional({ description: 'Merchandiser ID' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  merchandiserId?: number;

  @ApiPropertyOptional({ description: 'Order type', enum: OrderType })
  @IsOptional()
  @IsEnum(OrderType)
  ordertype?: OrderType;

  @ApiPropertyOptional({ description: 'Purchase order number search text' })
  @IsOptional()
  @IsString()
  pono?: string;

  @ApiPropertyOptional({ description: 'Active status', example: 'true' })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiPropertyOptional({ description: 'Return only soft deleted jobs', example: 'true' })
  @IsOptional()
  deletedOnly?: string | boolean;
}
