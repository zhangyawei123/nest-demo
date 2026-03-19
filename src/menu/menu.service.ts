import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async findAll(): Promise<Menu[]> {
    return this.menuRepository.find({ order: { sort: 'ASC', id: 'ASC' } });
  }

  async findTree(): Promise<Menu[]> {
    const allMenus = await this.menuRepository.find({ order: { sort: 'ASC', id: 'ASC' } });
    return this.buildTree(allMenus);
  }

  private buildTree(menus: Menu[], parentId: number | null = null): Menu[] {
    return menus
      .filter(menu => menu.parentId === parentId)
      .map(menu => ({
        ...menu,
        children: this.buildTree(menus, menu.id)
      }));
  }

  async findOne(id: number): Promise<Menu> {
    const menu = await this.menuRepository.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('菜单不存在');
    return menu;
  }

  async create(dto: CreateMenuDto): Promise<Menu> {
    const menu = this.menuRepository.create(dto);
    return this.menuRepository.save(menu);
  }

  async update(id: number, dto: Partial<CreateMenuDto>): Promise<Menu> {
    await this.findOne(id);
    await this.menuRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.menuRepository.delete(id);
  }
}
