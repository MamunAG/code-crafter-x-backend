import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

const toBoolean = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return undefined;
};

export class FilterCurrencyDto extends PaginationDto {
  @ApiProperty({ description: 'Currency name', example: 'Bangladeshi Taka', required: false })
  @IsOptional()
  currencyname?: string;

  @ApiProperty({ description: 'Currency code', example: 'BDT', required: false })
  @IsOptional()
  currencycode?: string;

  @ApiProperty({ description: 'Currency symbol', example: 'BDT', required: false })
  @IsOptional()
  symbol?: string;

  @ApiProperty({ description: 'Default currency flag', example: false, required: false })
  @Transform(toBoolean)
  @IsOptional()
  is_default?: boolean;

  @ApiProperty({ description: 'Active status', example: true, required: false })
  @Transform(toBoolean)
  @IsOptional()
  is_active?: boolean;
}
