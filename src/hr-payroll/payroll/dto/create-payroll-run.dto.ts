import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PayrollFrequency, PayrollRunType } from '../../common/hr.enums';

export class CreatePayrollRunDto {
  @ApiProperty() @IsUUID() factoryId: string;
  @ApiProperty() @IsUUID() payGroupId: string;
  @ApiProperty({ enum: PayrollFrequency }) @IsEnum(PayrollFrequency) frequency: PayrollFrequency;
  @ApiProperty({ enum: PayrollRunType }) @IsEnum(PayrollRunType) runType: PayrollRunType;
  @ApiProperty() @IsDateString() periodStart: string;
  @ApiProperty() @IsDateString() periodEnd: string;
  @ApiProperty() @IsDateString() paymentDate: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() rulePackId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) sequence?: number;
}
