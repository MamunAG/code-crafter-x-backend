import { Column, Entity, Index, Unique } from 'typeorm';
import { HrMasterDataType } from '../../../common/hr.enums';
import { HrTenantEntity } from '../../../common/entity/hr-tenant.entity';

@Entity('hr_master_data')
@Unique('uq_hr_master_data_org_type_code', ['organizationId', 'type', 'code'])
export class MasterData extends HrTenantEntity {
  @Index() @Column({ type: 'enum', enum: HrMasterDataType }) type: HrMasterDataType;
  @Column({ type: 'varchar', length: 80 }) code: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ name: 'name_bn', type: 'varchar', length: 255, nullable: true }) nameBn?: string | null;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) settings: Record<string, unknown>;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}
