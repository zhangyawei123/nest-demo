import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('lottery_records')
export class LotteryRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  prizeId: number;

  @Column({ length: 50 })
  prizeName: string;

  @Column({ nullable: true })
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}
