import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Size } from 'src/merchandising/master-data/size/entity/size.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Style } from './style.entity';

@Entity('style_to_size_map')
export class StyleToSizeMap extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Size ID', example: 1 })
  @Column({ name: 'size_id', type: 'integer', nullable: false })
  sizeId: number;

  @ApiProperty({ description: 'Style ID', example: 'uuid' })
  @Column({ name: 'style_id', type: 'uuid', nullable: false })
  styleId: string;

  @ApiProperty({ description: 'Style object', type: () => Style })
  @ManyToOne(() => Style, (style) => style.styleToSizeMaps, { nullable: false })
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @ApiProperty({ description: 'Size object', type: () => Size })
  @ManyToOne(() => Size, { nullable: false })
  @JoinColumn({ name: 'size_id' })
  size: Size;
}

