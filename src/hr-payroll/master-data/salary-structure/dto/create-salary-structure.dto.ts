import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SalaryComponentDto } from './salary-component.dto';

export class CreateSalaryStructureDto {
  @ApiProperty() @IsString() @IsNotEmpty() code: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsDateString() effectiveFrom: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
  @ApiProperty({ type: [SalaryComponentDto] }) @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => SalaryComponentDto) components: SalaryComponentDto[];
}
