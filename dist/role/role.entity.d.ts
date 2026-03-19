import { Menu } from '../menu/menu.entity';
export declare class Role {
    id: number;
    name: string;
    description: string;
    menus: Menu[];
    createdAt: Date;
    updatedAt: Date;
}
