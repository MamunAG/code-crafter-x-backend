import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Color } from 'src/merchandising/basic-setup/color/entity/color.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Style } from './style.entity';

@Entity('style_to_color_map')
export class StyleToColorMap extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Color ID', example: 1 })
  @Column({ name: 'color_id', type: 'integer', nullable: false })
  colorId: number;

  @ApiProperty({ description: 'Style ID', example: 'uuid' })
  @Column({ name: 'style_id', type: 'uuid', nullable: false })
  styleId: string;

  @ApiProperty({ description: 'Style object', type: () => Style })
  @ManyToOne(() => Style, (style) => style.styleToColorMaps, { nullable: false })
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @ApiProperty({ description: 'Color object', type: () => Color })
  @ManyToOne(() => Color, { nullable: false })
  @JoinColumn({ name: 'color_id' })
  color: Color;
}
