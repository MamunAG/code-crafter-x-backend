import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Point,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('users_location')
@Index('idx_userlocation_location', ['location'], { spatial: true })
@Index('idx_userlocation_user_id', ['user_id'])
export class UserLocation {
  @ApiProperty({ description: 'User ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Created by user id', example: 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', })
  @Column({ nullable: true })
  user_id: string;

  //const point = `POINT(${dto.longitude} ${dto.latitude})`;
  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326, nullable: false })
  location: Point;

  @Column({ type: 'double precision', nullable: false })
  latitude: number;

  @Column({ type: 'double precision', nullable: false })
  longitude: number;

  @Column({ nullable: true })
  area: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  //====================================================================
  @ApiProperty({ description: 'User created at', example: '2025-03-14T12:00:00.000Z', })
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'User updated at', example: '2025-03-14T12:00:00.000Z', })
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'User deleted at', example: '2025-03-14T12:00:00.000Z', })
  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date;

  /*Relations */
  @ApiProperty({ description: 'File object', type: () => User, })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  users: User;
}
