import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContactCatagoryEnum } from './contact-catagory.enum';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('contact')
export class Contact extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ContactCatagoryEnum, default: ContactCatagoryEnum.Other, })
  contact_catagory: ContactCatagoryEnum;

  @ApiProperty({ description: 'Remarks', example: 'some cause of account deletion.' })
  @Column({ unique: false, nullable: true })
  remarks: string;
}
