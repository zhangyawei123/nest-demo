import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('douyin_hot')
export class DouyinHot {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'int', default: 0 })
  hotValue: number;

  @Column({ length: 500, nullable: true })
  url: string;

  @Column({ length: 200, nullable: true })
  cover: string;

  @Column({ type: 'int', default: 0 })
  rank: number;

  @CreateDateColumn()
  createdAt: Date;
}
