import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { ContactCatagoryEnum } from '../entity/contact-catagory.enum';

export class FilterContactDto extends PaginationDto {
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: `must be within ${Object.values(ContactCatagoryEnum).join(', ')}`, enum: ContactCatagoryEnum, example: ContactCatagoryEnum.Other, })
  @IsEnum(ContactCatagoryEnum, { message: `must be within ${Object.values(ContactCatagoryEnum).join(', ')}` })
  @IsOptional()
  contact_catagory: ContactCatagoryEnum;

  @ApiProperty({ description: 'Remarks', example: 'some remarks.' })
  @IsOptional()
  remarks: string;
}
