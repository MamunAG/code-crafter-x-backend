import { ApiProperty } from '@nestjs/swagger';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { RolesEnum } from 'src/common/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('user_to_oranization_map')
export class UserToOranizationMap extends BaseEntity {
  @ApiProperty({ description: 'User ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Organization ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @PrimaryColumn({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ApiProperty({ description: 'Membership role', enum: RolesEnum, example: RolesEnum.admin })
  @Column({ type: 'enum', enum: RolesEnum, default: RolesEnum.user })
  role: RolesEnum;

  @ApiProperty({ description: 'User object', type: () => User })
  @ManyToOne(() => User, (user) => user.userToOranizationMaps, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Organization object', type: () => Organization })
  @ManyToOne(() => Organization, (organization) => organization.userToOranizationMaps, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
