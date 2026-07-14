import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RechargeOrder } from './recharge-order.entity';

@Entity('recharge_order_events')
export class RechargeOrderEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'order_id', type: 'int' })
  orderId: number;

  @ManyToOne(() => RechargeOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: RechargeOrder;

  @Column({ name: 'actor_id', type: 'int', nullable: true })
  actorId: number | null;

  @Column({ name: 'actor_type', type: 'varchar', length: 20 })
  actorType: 'user' | 'admin' | 'system';

  @Column({ type: 'varchar', length: 40 })
  action: string;

  @Column({ name: 'from_status', type: 'varchar', length: 20, nullable: true })
  fromStatus: string | null;

  @Column({ name: 'to_status', type: 'varchar', length: 20, nullable: true })
  toStatus: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  detail: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
