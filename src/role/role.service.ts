import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './role.entity';
import { Menu } from '../menu/menu.entity';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({ relations: ['menus'] });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id }, relations: ['menus'] });
    if (!role) throw new NotFoundException('角色不存在');
    return role;
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create({ name: dto.name, description: dto.description });
    if (dto.menuIds?.length) {
      role.menus = await this.menuRepository.findBy({ id: In(dto.menuIds) });
    } else {
      role.menus = [];
    }
    return this.roleRepository.save(role);
  }

  async update(id: number, dto: CreateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    role.name = dto.name ?? role.name;
    role.description = dto.description ?? role.description;
    if (dto.menuIds !== undefined) {
      role.menus = dto.menuIds.length
        ? await this.menuRepository.findBy({ id: In(dto.menuIds) })
        : [];
    }
    return this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.roleRepository.delete(id);
  }

  async assignMenus(id: number, menuIds: number[]): Promise<Role> {
    const role = await this.findOne(id);
    role.menus = menuIds.length
      ? await this.menuRepository.findBy({ id: In(menuIds) })
      : [];
    return this.roleRepository.save(role);
  }
}
