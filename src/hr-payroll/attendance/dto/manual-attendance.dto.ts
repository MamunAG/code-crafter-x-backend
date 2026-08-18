import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { AttendancePunchItemDto } from './attendance-punch-item.dto';

export class ManualAttendanceDto {
  @ApiProperty({ type: [AttendancePunchItemDto] }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(1000) @ValidateNested({ each: true }) @Type(() => AttendancePunchItemDto) punches: AttendancePunchItemDto[];
}
