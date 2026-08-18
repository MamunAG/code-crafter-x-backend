import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { AttendancePunchItemDto } from './attendance-punch-item.dto';

export class IngestAttendanceDto {
  @ApiProperty() @IsString() @IsNotEmpty() source: string;
  @ApiProperty({ type: [AttendancePunchItemDto] }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(1000) @ValidateNested({ each: true }) @Type(() => AttendancePunchItemDto) punches: AttendancePunchItemDto[];
}
