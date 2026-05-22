import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('draw_generations')
export class DrawGeneration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 })
  model: string;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'simple-json', nullable: true })
  image: unknown[];

  @Column({ length: 50, nullable: true })
  size: string;

  @Column({ name: 'response_format', length: 50, nullable: true })
  responseFormat: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ name: 'request_body', type: 'simple-json' })
  requestBody: Record<string, unknown>;

  @Column({ name: 'response_body', type: 'simple-json', nullable: true })
  responseBody: Record<string, unknown> | null;

  @Column({ name: 'generated_urls', type: 'simple-json', nullable: true })
  generatedUrls: string[] | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
