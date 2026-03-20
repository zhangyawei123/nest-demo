import { OperationLogService } from './operation-log.service';
export declare class OperationLogController {
    private readonly service;
    constructor(service: OperationLogService);
    findAll(page: string, pageSize: string, keyword?: string): Promise<{
        list: import("./operation-log.entity").OperationLog[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    clear(): Promise<void>;
}
