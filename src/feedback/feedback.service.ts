import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly repo: Repository<Feedback>,
  ) {}

  async create(dto: CreateFeedbackDto, user?: any) {
    const feedback = this.repo.create({
      type: dto.type,
      content: dto.content,
      contact: dto.contact,
      userId: user?.userId || null,
      username: user?.username || null,
    });
    return this.repo.save(feedback);
  }

  async findAll(query: QueryFeedbackDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const qb = this.repo
      .createQueryBuilder('feedback')
      .orderBy('feedback.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('feedback.status = :status', { status: query.status });
    }

    if (query.keyword?.trim()) {
      qb.andWhere(
        "(feedback.content LIKE :keyword OR COALESCE(feedback.contact, '') LIKE :keyword OR COALESCE(feedback.username, '') LIKE :keyword)",
        {
          keyword: `%${query.keyword.trim()}%`,
        },
      );
    }

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { list, total, page, pageSize };
  }

  async updateStatus(id: number, status: string) {
    const feedback = await this.repo.findOne({ where: { id } });
    if (!feedback) throw new NotFoundException('反馈不存在');
    feedback.status = status;
    feedback.handledAt = status === 'handled' ? new Date() : null;
    return this.repo.save(feedback);
  }

  async remove(id: number) {
    const feedback = await this.repo.findOne({ where: { id } });
    if (!feedback) throw new NotFoundException('反馈不存在');
    await this.repo.remove(feedback);
  }
}
