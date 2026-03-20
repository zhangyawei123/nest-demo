import { NoticeService } from './notice.service';
export declare class NoticeController {
    private readonly service;
    constructor(service: NoticeService);
    getActive(): Promise<import("./notice.entity").Notice[]>;
    findAll(page: string, pageSize: string): Promise<{
        list: import("./notice.entity").Notice[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    create(body: any, req: any): Promise<import("./notice.entity").Notice>;
    update(id: string, body: any): Promise<import("./notice.entity").Notice>;
    remove(id: string): Promise<void>;
}
