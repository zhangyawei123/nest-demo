import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../role/role.entity';
import { Menu } from '../menu/menu.entity';
export declare class UserController {
    private readonly userService;
    private readonly roleRepository;
    private readonly menuRepository;
    constructor(userService: UserService, roleRepository: Repository<Role>, menuRepository: Repository<Menu>);
    getUserById(id: string): Promise<any>;
    getMyMenus(req: any): Promise<any[]>;
    updateUser(id: string, updateUserDto: UpdateUserDto, req: any): Promise<import("./user.entity").User>;
    resetAdminPassword(): Promise<{
        message: string;
    }>;
    seed(): Promise<{
        message: string;
        menus: number;
        role: string;
    }>;
}
