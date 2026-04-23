import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('embellishment')
export class Embellishment extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Embellishment name', example: 'Beads' })
  @Column({ nullable: false })
  name: string;

  @ApiProperty({ description: 'Remarks', example: 'Hand-sewn beads for decoration.' })
  @Column({ type: 'text', nullable: true })
  remarks: string;

  @ApiProperty({ description: 'Active status', example: 'Y' })
  @Column({ type: 'varchar', length: 10, default: 'Y', nullable: false })
  is_active: string;
}
