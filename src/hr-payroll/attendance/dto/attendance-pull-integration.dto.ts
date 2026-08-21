import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  AttendancePullMethod,
  AttendanceSecretLocation,
} from '../attendance-pull.types';
import type { AttendancePullTargetField } from '../attendance-pull.types';

const TARGET_FIELDS: AttendancePullTargetField[] = [
  'externalEventId',
  'employeeId',
  'employeeCode',
  'punchedAt',
  'direction',
  'deviceIdentifier',
  'metadata',
];

export class AttendancePullMappingDto {
  @ApiProperty({ example: 'id' }) @IsString() @IsNotEmpty() sourcePath: string;
  @ApiProperty({ enum: TARGET_FIELDS })
  @IsIn(TARGET_FIELDS)
  targetField: AttendancePullTargetField;
}

export class AttendancePullSecretDto {
  @ApiProperty({ enum: AttendanceSecretLocation })
  @IsEnum(AttendanceSecretLocation)
  location: AttendanceSecretLocation;
  @ApiProperty({ example: 'X-API-Key' }) @IsString() @IsNotEmpty() key: string;
  @ApiPropertyOptional({
    description: 'Leave empty during update to retain the saved secret.',
  })
  @IsOptional()
  @IsString()
  value?: string;
}

export class CreateAttendancePullIntegrationDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsString() @IsNotEmpty() source: string;
  @ApiProperty()
  @IsUrl({
    require_tld: false,
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  endpointUrl: string;
  @ApiProperty({ enum: AttendancePullMethod })
  @IsEnum(AttendancePullMethod)
  method: AttendancePullMethod;
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  headers?: Record<string, unknown>;
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  query?: Record<string, unknown>;
  @ApiPropertyOptional({ type: Object }) @IsOptional() body?: unknown;
  @ApiPropertyOptional({ type: AttendancePullSecretDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AttendancePullSecretDto)
  secret?: AttendancePullSecretDto;
  @ApiPropertyOptional() @IsOptional() @IsString() responseItemsPath?:
    | string
    | null;
  @ApiPropertyOptional({ type: [AttendancePullMappingDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AttendancePullMappingDto)
  mappings?: AttendancePullMappingDto[];
  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  directionMap?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsString() cursorResponsePath?:
    | string
    | null;
  @ApiPropertyOptional({ minimum: 1, maximum: 10080 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10080)
  scheduleIntervalMinutes?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateAttendancePullIntegrationDto extends PartialType(
  CreateAttendancePullIntegrationDto,
) {}

export class TestAttendancePullIntegrationDto extends CreateAttendancePullIntegrationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() integrationId?: string;
}
