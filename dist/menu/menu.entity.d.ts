export declare class Menu {
    id: number;
    name: string;
    path: string;
    component: string;
    icon: string;
    sort: number;
    visible: boolean;
    parentId: number;
    parent: Menu;
    children: Menu[];
    createdAt: Date;
    updatedAt: Date;
}
