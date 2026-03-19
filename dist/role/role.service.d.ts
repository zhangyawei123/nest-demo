import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { Menu } from '../menu/menu.entity';
import { CreateRoleDto } from './dto/create-role.dto';
export declare class RoleService {
    private readonly roleRepository;
    private readonly menuRepository;
    constructor(roleRepository: Repository<Role>, menuRepository: Repository<Menu>);
    findAll(): Promise<Role[]>;
    findOne(id: number): Promise<Role>;
    create(dto: CreateRoleDto): Promise<Role>;
    update(id: number, dto: CreateRoleDto): Promise<Role>;
    remove(id: number): Promise<void>;
    assignMenus(id: number, menuIds: number[]): Promise<Role>;
}
