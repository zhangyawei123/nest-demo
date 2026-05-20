import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, default: '功能建议' })
  type: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  contact: string | null;

  @Column({ length: 30, default: 'pending' })
  status: string;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @Column({ name: 'username', type: 'varchar', length: 80, nullable: true })
  username: string | null;

  @Column({ name: 'handled_at', type: 'datetime', nullable: true })
  handledAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
