import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('douyin_comments')
export class DouyinComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  videoUrl: string;

  @Column({ length: 100, nullable: true })
  nickname: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ nullable: true })
  avatarUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
