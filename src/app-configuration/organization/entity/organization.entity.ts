import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserToOranizationMap } from 'src/app-configuration/user-to-oranization-map/entity/user-to-oranization-map.entity';

@Entity('organization')
export class Organization extends BaseEntity {
  @ApiProperty({ description: 'Primary ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Organization name', example: 'Code Crafter X' })
  @Column({ name: 'name', nullable: false })
  name: string;

  @ApiProperty({ description: 'Organization address', example: '123 Main Street, Dhaka' })
  @Column({ name: 'address', nullable: false })
  address: string;

  @ApiProperty({ description: 'Organization contact', example: '+8801712345678' })
  @Column({ name: 'contact', nullable: false })
  contact: string;

  @ApiProperty({ description: 'User mappings', type: () => [UserToOranizationMap], required: false })
  @OneToMany(() => UserToOranizationMap, (mapping) => mapping.organization)
  userToOranizationMaps: UserToOranizationMap[];
}
