import { User } from '../user/user.entity';
export declare class Article {
    id: number;
    title: string;
    logo: string;
    content: string;
    authorId: number;
    author: User;
    createdAt: Date;
    updatedAt: Date;
}
