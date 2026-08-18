import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PayrollComponentType } from '../../../common/hr.enums';

export class SalaryComponentDto {
  @ApiProperty() @IsString() @IsNotEmpty() code: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameBn?: string;
  @ApiProperty({ enum: PayrollComponentType }) @IsEnum(PayrollComponentType) type: PayrollComponentType;
  @ApiProperty() @IsString() @IsNotEmpty() formula: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sortOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isTaxable?: boolean;
}
