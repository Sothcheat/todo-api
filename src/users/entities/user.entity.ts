import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from '../../profile/entities/profile.entity.js';

// "admin" can manage every user and todo; "user" only their own.
export const userRoles = ['user', 'admin'] as const;
export type Role = (typeof userRoles)[number];

// The login identity. Public details (name, bio) live on Profile.
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: userRoles, default: 'user' })
  role: Role;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Relation<Profile>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
