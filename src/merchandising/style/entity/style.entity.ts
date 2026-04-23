import { ApiProperty } from '@nestjs/swagger';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Files } from 'src/files/entities/file.entity';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('styles')
export class Style extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Product type', example: 'Woven' })
  @Column({ name: 'product_type', type: 'varchar', length: 255, nullable: true })
  productType?: string;

  @ApiProperty({ description: 'Buyer ID', example: 'uuid' })
  @Column({ name: 'buyer_id', type: 'uuid', nullable: false })
  buyerId: string;

  @ApiProperty({ description: 'Style number', example: 'ST-001' })
  @Column({ name: 'style_no', type: 'varchar', length: 255, nullable: false })
  styleNo: string;

  @ApiProperty({ description: 'Style name', example: 'Summer Shirt' })
  @Column({ name: 'style_name', type: 'varchar', length: 255, nullable: true })
  styleName?: string;

  @ApiProperty({ description: 'Item type', example: 'Top' })
  @Column({ name: 'item_type', type: 'varchar', length: 255, nullable: true })
  itemType?: string;

  @ApiProperty({ description: 'Product department', example: 'Mens Wear' })
  @Column({ name: 'product_department', type: 'varchar', length: 255, nullable: true })
  productDepartment?: string;

  @ApiProperty({ description: 'CM sewing', example: 0 })
  @Column({ name: 'cm_sewing', type: 'double precision', default: 0 })
  cmSewing: number;

  @ApiProperty({ description: 'Currency ID', example: 1 })
  @Column({ name: 'currency_id', type: 'integer', nullable: false })
  currencyId: number;

  @ApiProperty({ description: 'SMV sewing', example: 0 })
  @Column({ name: 'smv_sewing', type: 'double precision', default: 0 })
  smvSewing: number;

  @ApiProperty({ description: 'SMV sewing side seam', example: 0 })
  @Column({ name: 'smv_sewing_side_seam', type: 'double precision', default: 0 })
  smvSewingSideSeam: number;

  @ApiProperty({ description: 'SMV cutting', example: 0 })
  @Column({ name: 'smv_cutting', type: 'double precision', default: 0 })
  smvCutting: number;

  @ApiProperty({ description: 'SMV cutting side seam', example: 0 })
  @Column({ name: 'smv_cutting_side_seam', type: 'integer', default: 0 })
  smvCuttingSideSeam: number;

  @ApiProperty({ description: 'SMV finishing', example: 0 })
  @Column({ name: 'smv_finishing', type: 'double precision', default: 0 })
  smvFinishing: number;

  @ApiProperty({ description: 'Image ID', example: 1, required: false })
  @Column({ name: 'image_id', type: 'integer', nullable: true })
  imageId?: number;

  @ApiProperty({ description: 'Remarks', example: 'Prototype style.' })
  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks?: string;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;

  @ApiProperty({ description: 'Item UOM', example: 'Pcs' })
  @Column({ name: 'item_uom', type: 'varchar', length: 100, nullable: true })
  itemUom?: 'Pcs' | 'Set';

  @ApiProperty({ description: 'Product family', example: 'Knitwear' })
  @Column({ name: 'product_family', type: 'varchar', length: 255, nullable: true })
  productFamily?: string;

  @ApiProperty({ description: 'Buyer object', type: () => Buyer })
  @ManyToOne(() => Buyer, { nullable: false })
  @JoinColumn({ name: 'buyer_id' })
  buyer: Buyer;

  @ApiProperty({ description: 'Currency object', type: () => Currency })
  @ManyToOne(() => Currency, { nullable: false })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @ApiProperty({ description: 'Image object', type: () => Files, required: false })
  @ManyToOne(() => Files, { nullable: true })
  @JoinColumn({ name: 'image_id' })
  image?: Files;
}
