import { Repository } from 'typeorm';
import { OperationLog } from './operation-log.entity';
export declare class OperationLogService {
    private readonly repo;
    constructor(repo: Repository<OperationLog>);
    log(data: Partial<OperationLog>): Promise<OperationLog>;
    findAll(page?: number, pageSize?: number, keyword?: string): Promise<{
        list: OperationLog[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    clear(): Promise<void>;
}
