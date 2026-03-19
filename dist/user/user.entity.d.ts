import { Role } from '../role/role.entity';
export declare class User {
    id: number;
    username: string;
    password: string;
    roles: Role[];
    createdAt: Date;
    updatedAt: Date;
}
