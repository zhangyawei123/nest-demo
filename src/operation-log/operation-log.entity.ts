import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, nullable: true })
  username: string;

  @Column({ name: 'user_id', nullable: true })
  userId: number;

  @Column({ length: 200 })
  module: string;

  @Column({ length: 200 })
  action: string;

  @Column({ length: 500, nullable: true })
  detail: string;

  @Column({ length: 50, nullable: true })
  ip: string;

  @Column({ default: 'success' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
