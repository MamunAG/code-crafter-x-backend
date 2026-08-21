import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PayrollFrequency, PayrollProcessingMode, PayrollRunType } from '../../common/hr.enums';

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
  @ApiPropertyOptional({ enum: PayrollProcessingMode, default: PayrollProcessingMode.Bulk }) @IsOptional() @IsEnum(PayrollProcessingMode) processingMode?: PayrollProcessingMode;
  @ApiPropertyOptional({ description: 'Required when processing an individual employee.' }) @IsOptional() @IsUUID() employeeId?: string;
  @ApiPropertyOptional({ description: 'Optional bulk department filter.' }) @IsOptional() @IsUUID() departmentId?: string;
  @ApiPropertyOptional({ description: 'Optional bulk designation filter.' }) @IsOptional() @IsUUID() designationId?: string;
  @ApiPropertyOptional({ description: 'Optional bulk section filter from the employee official profile.' }) @IsOptional() @IsString() sectionName?: string;
  @ApiPropertyOptional({ description: 'Process every eligible employee in the selected factory and pay group.' }) @IsOptional() @IsBoolean() includeAllEligible?: boolean;
  @ApiPropertyOptional({ type: Object, description: 'Run-level numeric variables available to custom salary formulas.' }) @IsOptional() @IsObject() formulaInputs?: Record<string, unknown>;
}

export class PayrollScopeOptionsDto {
  @ApiProperty() @IsUUID() factoryId: string;
  @ApiProperty() @IsUUID() payGroupId: string;
}
