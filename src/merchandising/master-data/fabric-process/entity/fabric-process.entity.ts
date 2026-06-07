import { ApiProperty } from '@nestjs/swagger';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum FabricProcessStage {
  YARN_PREPARATION = 'YARN_PREPARATION',
  YARN_TO_GREY = 'YARN_TO_GREY',
  GREY_TO_FINISHED = 'GREY_TO_FINISHED',
}

@Entity('fabric_process')
export class FabricProcess extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Fabric process name', example: 'Dyeing' })
  @Column({ name: 'name', nullable: false })
  name: string;

  @ApiProperty({ description: 'Production stage', enum: FabricProcessStage, example: FabricProcessStage.GREY_TO_FINISHED })
  @Column({ name: 'stage', type: 'varchar', default: FabricProcessStage.GREY_TO_FINISHED })
  stage: FabricProcessStage;

  @ApiProperty({ description: 'Display and calculation order', example: 0 })
  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'Organization ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;

  @ApiProperty({ description: 'Organization', type: () => Organization, required: false })
  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;

}
