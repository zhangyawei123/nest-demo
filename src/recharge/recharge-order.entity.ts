import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { RechargePackage } from './recharge-package.entity';

export type RechargeOrderStatus =
  | 'pending'
  | 'paid'
  | 'refund_pending'
  | 'cancelled'
  | 'refunded';

@Entity('recharge_orders')
export class RechargeOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ name: 'order_no', length: 40 })
  orderNo: string;

  @Index()
  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'package_id', type: 'int', nullable: true })
  packageId: number | null;

  @ManyToOne(() => RechargePackage, { nullable: true })
  @JoinColumn({ name: 'package_id' })
  package: RechargePackage | null;

  @Column({ name: 'package_name', length: 80 })
  packageName: string;

  @Column({ name: 'amount_cents', type: 'int' })
  amountCents: number;

  @Column({ type: 'int' })
  points: number;

  @Column({ name: 'bonus_points', type: 'int', default: 0 })
  bonusPoints: number;

  @Column({ name: 'total_points', type: 'int' })
  totalPoints: number;

  @Index()
  @Column({ length: 20, default: 'pending' })
  status: RechargeOrderStatus;

  @Column({ name: 'paid_at', type: 'datetime', nullable: true })
  paidAt: Date | null;

  @Column({
    name: 'payment_proof_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  paymentProofUrl: string | null;

  @Column({ name: 'payment_submitted_at', type: 'datetime', nullable: true })
  paymentSubmittedAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'refunded_at', type: 'datetime', nullable: true })
  refundedAt: Date | null;

  @Column({ name: 'refund_requested_at', type: 'datetime', nullable: true })
  refundRequestedAt: Date | null;

  @Column({
    name: 'refund_reason',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  refundReason: string | null;

  @Column({ name: 'refund_handled_at', type: 'datetime', nullable: true })
  refundHandledAt: Date | null;

  @Column({ name: 'refund_handled_by', type: 'int', nullable: true })
  refundHandledBy: number | null;

  @Column({
    name: 'refund_decision_remark',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  refundDecisionRemark: string | null;

  @Column({ name: 'confirmed_by', type: 'int', nullable: true })
  confirmedBy: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  remark: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
