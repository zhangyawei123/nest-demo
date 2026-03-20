import { Repository } from 'typeorm';
import { Notice } from './notice.entity';
export declare class NoticeService {
    private readonly repo;
    constructor(repo: Repository<Notice>);
    findAll(page?: number, pageSize?: number): Promise<{
        list: Notice[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findEnabled(): Promise<Notice[]>;
    create(data: Partial<Notice>): Promise<Notice>;
    update(id: number, data: Partial<Notice>): Promise<Notice>;
    remove(id: number): Promise<void>;
}
