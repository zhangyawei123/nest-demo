import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 100, nullable: true })
  path: string;

  @Column({ length: 200, nullable: true })
  component: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ default: 0 })
  sort: number;

  @Column({ default: true })
  visible: boolean;

  @Column({ nullable: true })
  parentId: number;

  @ManyToOne(() => Menu, menu => menu.children, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Menu;

  @OneToMany(() => Menu, menu => menu.parent)
  children: Menu[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
