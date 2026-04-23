import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Embellishment } from 'src/merchandising/basic-setup/embellishment/entity/embellishment.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Style } from './style.entity';

@Entity('style_to_embellishment_map')
export class StyleToEmbellishmentMap extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Embellishment ID', example: 1 })
  @Column({ name: 'embellishment_id', type: 'integer', nullable: false })
  embellishmentId: number;

  @ApiProperty({ description: 'Style ID', example: 'uuid' })
  @Column({ name: 'style_id', type: 'uuid', nullable: false })
  styleId: string;

  @ApiProperty({ description: 'Style object', type: () => Style })
  @ManyToOne(() => Style, (style) => style.styleToEmbellishmentMaps, { nullable: false })
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @ApiProperty({ description: 'Embellishment object', type: () => Embellishment })
  @ManyToOne(() => Embellishment, { nullable: false })
  @JoinColumn({ name: 'embellishment_id' })
  embellishment: Embellishment;
}
