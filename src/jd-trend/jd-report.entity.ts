import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('jd_trend_reports')
export class JdTrendReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', unique: true })
  reportDate: string;

  @Column({ length: 30 })
  status: string;

  @Column({ type: 'int', default: 0 })
  productCount: number;

  @Column({ type: 'int', default: 0 })
  successCount: number;

  @Column({ length: 30, default: 'missing' })
  cookieStatus: string;

  @Column({ length: 20, default: '' })
  collectionSlot: string;

  @Column({ type: 'longtext' })
  reportData: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
