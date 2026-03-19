import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignMenusDto } from './dto/assign-menus.dto';
export declare class RoleController {
    private readonly roleService;
    constructor(roleService: RoleService);
    findAll(): Promise<import("./role.entity").Role[]>;
    findOne(id: string): Promise<import("./role.entity").Role>;
    create(dto: CreateRoleDto): Promise<import("./role.entity").Role>;
    update(id: string, dto: CreateRoleDto): Promise<import("./role.entity").Role>;
    remove(id: string): Promise<void>;
    assignMenus(id: string, dto: AssignMenusDto): Promise<import("./role.entity").Role>;
}
