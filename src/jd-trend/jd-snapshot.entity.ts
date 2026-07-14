import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

const numberTransformer = {
  to: (value: number | null) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

@Entity('jd_trend_snapshots')
@Index(['sku', 'snapshotDate', 'snapshotSlot'], { unique: true })
export class JdTrendSnapshot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column({ length: 30 })
  sku: string;

  @Column({ type: 'date' })
  snapshotDate: string;

  @Column({ length: 2, default: '00' })
  snapshotSlot: string;

  @Column({ type: 'datetime' })
  capturedAt: Date;

  @Column({ length: 500 })
  productUrl: string;

  @Column({ length: 500, default: '' })
  title: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numberTransformer,
  })
  price: number | null;

  @Column({ type: 'bigint', nullable: true, transformer: numberTransformer })
  commentCount: number | null;

  @Column({ length: 300, default: '' })
  shop: string;

  @Column({ length: 300, default: '' })
  stockText: string;

  @Column({ length: 200, default: '' })
  rankName: string;

  @Column({ type: 'int', nullable: true })
  rankPosition: number | null;

  @Column({ length: 300, default: '' })
  rankText: string;

  @Column({ length: 30, default: 'ok' })
  pageStatus: string;

  @Column({ length: 1000, default: '' })
  error: string;

  @CreateDateColumn()
  createdAt: Date;
}
