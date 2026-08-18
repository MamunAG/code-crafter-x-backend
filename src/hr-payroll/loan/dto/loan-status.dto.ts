import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt } from 'class-validator';
import { LoanStatus } from '../../common/hr.enums';

export class LoanStatusDto {
  @ApiProperty({ enum: LoanStatus }) @IsEnum(LoanStatus) status: LoanStatus;
  @ApiProperty() @IsInt() rowVersion: number;
}
