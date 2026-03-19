import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: number): Promise<User>;
    getMenusByUserId(id: number): Promise<any[]>;
    assignRoles(id: number, roles: any[]): Promise<User>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    validatePassword(md5Password: string, storedPassword: string): Promise<boolean>;
}
