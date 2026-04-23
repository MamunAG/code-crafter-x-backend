import { ApiProperty, PartialType } from '@nestjs/swagger';
import { ContactCatagoryEnum } from '../entity/contact-catagory.enum';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Contact } from '../entity/contact.entity';

export class UpdateContactDto extends PartialType(Contact) {
  @ApiProperty({ description: `must be within ${Object.values(ContactCatagoryEnum).join(', ')}`, enum: ContactCatagoryEnum, example: ContactCatagoryEnum.Other, })
  @IsEnum(ContactCatagoryEnum, { message: `must be within ${Object.values(ContactCatagoryEnum).join(', ')}` })
  @IsNotEmpty()
  contact_catagory: ContactCatagoryEnum;

  @ApiProperty({ description: 'Remarks', example: 'some cause of account deletion.' })
  @IsOptional()
  remarks: string;
}
