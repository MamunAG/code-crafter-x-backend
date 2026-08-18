import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AttendanceDirection } from '../../common/hr.enums';
import { Employee } from '../../employee/entity/employee.entity';

@Entity('hr_attendance_punches')
@Unique('uq_hr_punch_source_external', ['organizationId', 'source', 'externalEventId'])
@Index('idx_hr_punch_employee_time', ['organizationId', 'employeeId', 'punchedAt'])
export class AttendancePunch {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'organization_id', type: 'uuid' }) organizationId: string;
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @ManyToOne(() => Employee, { nullable: false }) @JoinColumn({ name: 'employee_id' }) employee: Employee;
  @Column({ type: 'varchar', length: 120 }) source: string;
  @Column({ name: 'external_event_id', type: 'varchar', length: 255 }) externalEventId: string;
  @Column({ name: 'punched_at', type: 'timestamptz' }) punchedAt: Date;
  @Column({ type: 'enum', enum: AttendanceDirection, default: AttendanceDirection.Unknown }) direction: AttendanceDirection;
  @Column({ name: 'device_identifier', type: 'varchar', length: 255, nullable: true }) deviceIdentifier?: string | null;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) metadata: Record<string, unknown>;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
