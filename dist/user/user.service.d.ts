import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../role/role.entity';
export declare class UserService {
    private userRepository;
    private roleRepository;
    constructor(userRepository: Repository<User>, roleRepository: Repository<Role>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: number): Promise<User>;
    findAll(keyword?: string): Promise<any[]>;
    getMenusByUserId(id: number): Promise<any[]>;
    private buildMenuTree;
    assignRoles(id: number, roles: any[]): Promise<User>;
    assignRoleIds(id: number, roleIds: number[]): Promise<any>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    validatePassword(md5Password: string, storedPassword: string): Promise<boolean>;
    private sanitizeUser;
}
