import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { HrMasterDataType } from '../hr.enums';

export class TenantPaginationDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: HrMasterDataType }) @IsOptional() @IsEnum(HrMasterDataType) type?: HrMasterDataType;
}
