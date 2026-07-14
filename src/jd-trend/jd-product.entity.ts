import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('jd_trend_products')
export class JdTrendProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30, unique: true })
  sku: string;

  @Column({ length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 300, nullable: true })
  name: string | null;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
