import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsUUID } from 'class-validator';

export class CreateAttendanceCorrectionDto {
  @ApiProperty() @IsUUID() attendanceDayId: string;
  @ApiProperty() @IsObject() requestedValues: Record<string, unknown>;
  @ApiProperty() @IsString() @IsNotEmpty() reason: string;
}
