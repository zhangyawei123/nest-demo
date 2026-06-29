import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('daily_sign_ins')
@Index(['userId', 'signDate'], { unique: true })
export class DailySignIn {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'sign_date', type: 'date' })
  signDate: string;

  @Column({ type: 'int', default: 2 })
  points: number;

  @Column({ name: 'is_makeup', type: 'boolean', default: false })
  isMakeup: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
