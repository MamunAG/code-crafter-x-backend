import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class EmploymentTypeSettingsDto {
  @ApiProperty({ enum: ['PERMANENT', 'CONTRACT', 'TEMPORARY', 'PROBATION', 'INTERN', 'CASUAL'] }) @IsIn(['PERMANENT', 'CONTRACT', 'TEMPORARY', 'PROBATION', 'INTERN', 'CASUAL']) employmentCategory: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(730) defaultProbationDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() overtimeEligible?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() leaveEligible?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() benefitsEligible?: boolean;
}

export class GradeSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(9999) rank?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() managementLevel?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() overtimeEligible?: boolean;
}

export class PayGroupSettingsDto {
  @ApiProperty({ enum: ['WEEKLY', 'BIWEEKLY', 'SEMIMONTHLY', 'MONTHLY'] }) @IsIn(['WEEKLY', 'BIWEEKLY', 'SEMIMONTHLY', 'MONTHLY']) frequency: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cutoffRule?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(90) paymentOffsetDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) defaultWorkingDays?: number;
}

export class WorkLocationSettingsDto {
  @ApiProperty({ enum: ['FACTORY', 'OFFICE', 'WAREHOUSE', 'REMOTE', 'OTHER'] }) @IsIn(['FACTORY', 'OFFICE', 'WAREHOUSE', 'REMOTE', 'OTHER']) locationType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() factoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() district?: string;
  @ApiPropertyOptional({ default: 'Asia/Dhaka' }) @IsOptional() @IsString() timezone?: string;
}

export class HolidayRowDto {
  @ApiProperty({ example: '2026-02-21' }) @IsString() date: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameBn?: string;
}

export class HolidayCalendarSettingsDto {
  @ApiProperty() @IsInt() @Min(2000) @Max(2200) year: number;
  @ApiPropertyOptional({ type: [Number] }) @IsOptional() @IsArray() weeklyRestDays?: number[];
  @ApiPropertyOptional({ type: [HolidayRowDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => HolidayRowDto) holidays?: HolidayRowDto[];
}

export class LeaveTypeSettingsDto {
  @ApiProperty({ enum: ['PAID', 'UNPAID'] }) @IsIn(['PAID', 'UNPAID']) leaveClassification: string;
  @ApiPropertyOptional({ enum: ['DAY', 'HOUR'] }) @IsOptional() @IsIn(['DAY', 'HOUR']) dayUnit?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() countCalendarDays?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(3) approvalLevels?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowNegativeBalance?: boolean;
  @ApiPropertyOptional({ enum: ['NONE', 'MONTHLY', 'QUARTERLY', 'YEARLY'] }) @IsOptional() @IsIn(['NONE', 'MONTHLY', 'QUARTERLY', 'YEARLY']) accrualFrequency?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) accrualRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() carryForwardAllowed?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) carryForwardCap?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(120) expiryMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() encashable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() halfDayAllowed?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() attachmentRequired?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxConsecutiveDays?: number;
}

export class SalaryComponentSettingsDto {
  @ApiProperty({ enum: ['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION', 'INFORMATIONAL'] }) @IsIn(['EARNING', 'DEDUCTION', 'EMPLOYER_CONTRIBUTION', 'INFORMATIONAL']) componentType: string;
  @ApiProperty({ enum: ['FIXED', 'PERCENTAGE', 'FORMULA'] }) @IsIn(['FIXED', 'PERCENTAGE', 'FORMULA']) calculationMethod: string;
  @ApiPropertyOptional() @IsOptional() @IsString() formula?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() taxable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() recurring?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() prorated?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() affectsGross?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(4) roundingPrecision?: number;
}

export class SeparationReasonSettingsDto {
  @ApiProperty({ enum: ['VOLUNTARY', 'INVOLUNTARY', 'RETIREMENT', 'OTHER'] }) @IsIn(['VOLUNTARY', 'INVOLUNTARY', 'RETIREMENT', 'OTHER']) separationCategory: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() eligibleForRehire?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() noticeRequired?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(730) defaultNoticeDays?: number;
}
