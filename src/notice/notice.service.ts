import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from './notice.entity';

@Injectable()
export class NoticeService {
  constructor(
    @InjectRepository(Notice)
    private readonly repo: Repository<Notice>,
  ) {}

  async findAll(page = 1, pageSize = 10) {
    const [list, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { list, total, page, pageSize };
  }

  async findEnabled() {
    return this.repo.find({ where: { enabled: true }, order: { createdAt: 'DESC' } });
  }

  async create(data: Partial<Notice>) {
    const notice = this.repo.create(data);
    return this.repo.save(notice);
  }

  async update(id: number, data: Partial<Notice>) {
    const notice = await this.repo.findOne({ where: { id } });
    if (!notice) throw new NotFoundException('公告不存在');
    Object.assign(notice, data);
    return this.repo.save(notice);
  }

  async remove(id: number) {
    const notice = await this.repo.findOne({ where: { id } });
    if (!notice) throw new NotFoundException('公告不存在');
    await this.repo.remove(notice);
  }
}
