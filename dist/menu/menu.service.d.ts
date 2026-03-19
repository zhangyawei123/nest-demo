import { Repository } from 'typeorm';
import { Menu } from './menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
export declare class MenuService {
    private readonly menuRepository;
    constructor(menuRepository: Repository<Menu>);
    findAll(): Promise<Menu[]>;
    findTree(): Promise<Menu[]>;
    private buildTree;
    findOne(id: number): Promise<Menu>;
    create(dto: CreateMenuDto): Promise<Menu>;
    update(id: number, dto: Partial<CreateMenuDto>): Promise<Menu>;
    remove(id: number): Promise<void>;
}
