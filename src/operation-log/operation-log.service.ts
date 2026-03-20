import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from './operation-log.entity';

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly repo: Repository<OperationLog>,
  ) {}

  async log(data: Partial<OperationLog>) {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  async findAll(page = 1, pageSize = 20, keyword?: string) {
    const qb = this.repo.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');
    if (keyword?.trim()) {
      qb.where('(log.username LIKE :kw OR log.module LIKE :kw OR log.action LIKE :kw)', {
        kw: `%${keyword.trim()}%`,
      });
    }
    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { list, total, page, pageSize };
  }

  async clear() {
    await this.repo.clear();
  }
}
