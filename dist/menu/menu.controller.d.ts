import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
export declare class MenuController {
    private readonly menuService;
    constructor(menuService: MenuService);
    findAll(): Promise<import("./menu.entity").Menu[]>;
    findTree(): Promise<import("./menu.entity").Menu[]>;
    create(dto: CreateMenuDto): Promise<import("./menu.entity").Menu>;
    update(id: string, dto: CreateMenuDto): Promise<import("./menu.entity").Menu>;
    remove(id: string): Promise<void>;
}
