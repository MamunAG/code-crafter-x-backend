import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EmployeeLifecycleAction } from '../../common/hr.enums';

export class EmployeeLifecycleDto {
  @ApiProperty({ enum: EmployeeLifecycleAction }) @IsEnum(EmployeeLifecycleAction) action: EmployeeLifecycleAction;
  @ApiProperty() @IsDateString() effectiveFrom: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() factoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() designationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() supervisorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() gradeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() payGroupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
