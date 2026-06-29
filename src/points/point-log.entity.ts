import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('point_logs')
export class PointLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  amount: number;

  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter: number;

  @Column({ length: 20 })
  type: string;

  @Column({ length: 50 })
  scene: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;

  @Column({ name: 'ref_type', type: 'varchar', length: 50, nullable: true })
  refType: string | null;

  @Column({ name: 'ref_id', type: 'int', nullable: true })
  refId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
