import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterEmbellishmentDto extends PaginationDto {
  @ApiProperty({ description: 'Embellishment name', example: 'Beads', required: false })
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'Remarks', example: 'Hand-sewn beads for decoration.', required: false })
  @IsOptional()
  remarks: string;

  @ApiProperty({ description: 'Active status', example: 'Y', required: false })
  @IsOptional()
  isActive: string;

  @ApiProperty({ description: 'Whether to fetch deleted items only', required: false, default: false })
  @Transform(({ value }: TransformFnParams): boolean | string => {
    if (value === true || value === 'true') {
      return true;
    }

    if (value === false || value === 'false') {
      return false;
    }

    return value;
  })
  @IsBoolean()
  @IsOptional()
  deletedOnly?: boolean;
}
