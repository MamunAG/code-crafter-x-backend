import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('size')
export class Size extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Color name', example: 'Blue' })
  @Column({ nullable: false })
  size_name: string;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;
}
