import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('lottery_prizes')
export class LotteryPrize {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 200, nullable: true })
  description: string;

  @Column({ length: 200, nullable: true })
  icon: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  probability: number;

  @Column({ length: 20, nullable: true })
  color: string;

  @Column({ default: 0 })
  sort: number;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
