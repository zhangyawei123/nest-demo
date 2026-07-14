import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('recharge_packages')
export class RechargePackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;

  @Column({ name: 'price_cents', type: 'int' })
  priceCents: number;

  @Column({ type: 'int' })
  points: number;

  @Column({ name: 'bonus_points', type: 'int', default: 0 })
  bonusPoints: number;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
