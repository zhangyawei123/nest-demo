import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { PointsService } from '../points/points.service';
import { RechargePackage } from './recharge-package.entity';
import { RechargeOrder, RechargeOrderStatus } from './recharge-order.entity';
import { CreateRechargePackageDto } from './dto/create-recharge-package.dto';
import { UpdateRechargePackageDto } from './dto/update-recharge-package.dto';
import { ListRechargeOrderDto } from './dto/list-recharge-order.dto';
import { RechargeOrderEvent } from './recharge-order-event.entity';

@Injectable()
export class RechargeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pointsService: PointsService,
    @InjectRepository(RechargePackage)
    private readonly packageRepo: Repository<RechargePackage>,
    @InjectRepository(RechargeOrder)
    private readonly orderRepo: Repository<RechargeOrder>,
    @InjectRepository(RechargeOrderEvent)
    private readonly orderEventRepo: Repository<RechargeOrderEvent>,
  ) {}

  listEnabledPackages() {
    return this.packageRepo.find({
      where: { enabled: true },
      order: { sort: 'ASC', priceCents: 'ASC', id: 'ASC' },
    });
  }

  listPackages() {
    return this.packageRepo.find({
      order: { sort: 'ASC', priceCents: 'ASC', id: 'ASC' },
    });
  }

  async createPackage(dto: CreateRechargePackageDto) {
    const pack = this.packageRepo.create({
      ...dto,
      description: dto.description || null,
      bonusPoints: dto.bonusPoints || 0,
      enabled: dto.enabled ?? true,
      sort: dto.sort || 0,
    });
    return this.packageRepo.save(pack);
  }

  async updatePackage(id: number, dto: UpdateRechargePackageDto) {
    const pack = await this.findPackage(id);
    Object.assign(pack, {
      ...dto,
      description:
        dto.description === undefined
          ? pack.description
          : dto.description || null,
      bonusPoints:
        dto.bonusPoints === undefined ? pack.bonusPoints : dto.bonusPoints,
      enabled: dto.enabled === undefined ? pack.enabled : dto.enabled,
      sort: dto.sort === undefined ? pack.sort : dto.sort,
    });
    await this.packageRepo.save(pack);
    return this.findPackage(id);
  }

  async createOrder(userId: number, packageId: number) {
    return this.dataSource.transaction(async (manager) => {
      const pack = await manager.findOne(RechargePackage, {
        where: { id: packageId },
        lock: { mode: 'pessimistic_read' },
      });
      if (!pack || !pack.enabled) {
        throw new NotFoundException('充值套餐不存在或已下架');
      }

      const totalPoints = pack.points + (pack.bonusPoints || 0);
      const order = manager.create(RechargeOrder, {
        orderNo: this.generateOrderNo(),
        userId,
        packageId: pack.id,
        packageName: pack.name,
        amountCents: pack.priceCents,
        points: pack.points,
        bonusPoints: pack.bonusPoints || 0,
        totalPoints,
        status: 'pending',
      });

      const savedOrder = await manager.save(RechargeOrder, order);
      await this.createEvent(
        manager,
        savedOrder.id,
        userId,
        'user',
        'created',
        {
          toStatus: 'pending',
          detail: `创建充值订单：${pack.name}`,
        },
      );
      return savedOrder;
    });
  }

  async submitPaymentProof(userId: number, id: number, file: any) {
    if (!file) {
      throw new BadRequestException('请选择支付凭证');
    }
    if (!file.mimetype?.match(/^image\/(jpg|jpeg|png|webp)$/)) {
      throw new BadRequestException('支付凭证仅支持 JPG、PNG、WEBP 图片');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('支付凭证不能超过 5MB');
    }

    const order = await this.orderRepo.findOne({ where: { id, userId } });
    if (!order) {
      throw new NotFoundException('充值订单不存在');
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('只有待支付订单可以提交支付凭证');
    }

    const extension =
      file.mimetype === 'image/png'
        ? '.png'
        : file.mimetype === 'image/webp'
          ? '.webp'
          : '.jpg';
    const filename = `${randomUUID()}${extension}`;
    const relativeUrl = `/uploads/recharge-proofs/${filename}`;
    const uploadDir = join(process.cwd(), 'uploads', 'recharge-proofs');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), file.buffer);

    return this.dataSource.transaction(async (manager) => {
      const lockedOrder = await manager.findOne(RechargeOrder, {
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedOrder || lockedOrder.status !== 'pending') {
        throw new BadRequestException('订单状态已变化，请刷新后重试');
      }

      lockedOrder.paymentProofUrl = relativeUrl;
      lockedOrder.paymentSubmittedAt = new Date();
      await manager.save(RechargeOrder, lockedOrder);
      await this.createEvent(
        manager,
        id,
        userId,
        'user',
        'payment_proof_submitted',
        {
          fromStatus: 'pending',
          toStatus: 'pending',
          detail: '用户提交支付凭证',
        },
      );
      return lockedOrder;
    });
  }

  async listMyOrders(userId: number, query: ListRechargeOrderDto) {
    return this.listOrders({ ...query, userId });
  }

  async listAdminOrders(query: ListRechargeOrderDto) {
    return this.listOrders(query);
  }

  async confirmOrder(id: number, adminUserId: number, remark?: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(RechargeOrder, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException('充值订单不存在');
      }
      if (order.status === 'paid') {
        throw new BadRequestException('订单已支付，不能重复确认');
      }
      if (order.status !== 'pending') {
        throw new BadRequestException('只有待支付订单可以确认支付');
      }
      if (!order.paymentProofUrl) {
        throw new BadRequestException('用户尚未提交支付凭证');
      }

      const fromStatus = order.status;
      order.status = 'paid';
      order.paidAt = new Date();
      order.confirmedBy = adminUserId;
      order.remark = remark || order.remark;
      await manager.save(RechargeOrder, order);

      await this.pointsService.earnWithManager(
        manager,
        order.userId,
        order.totalPoints,
        {
          scene: 'recharge',
          description: `充值到账：${order.packageName}`,
          refType: 'recharge_order',
          refId: order.id,
        },
      );

      await this.createEvent(
        manager,
        order.id,
        adminUserId,
        'admin',
        'payment_confirmed',
        {
          fromStatus,
          toStatus: 'paid',
          detail: remark?.trim() || '商家确认收款，积分已到账',
        },
      );

      return manager.findOneOrFail(RechargeOrder, { where: { id: order.id } });
    });
  }

  async cancelOrder(id: number, userId?: number) {
    return this.dataSource.transaction(async (manager) => {
      const where = userId ? { id, userId } : { id };
      const order = await manager.findOne(RechargeOrder, {
        where,
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException('充值订单不存在');
      }
      if (order.status !== 'pending') {
        throw new BadRequestException('只有待支付订单可以取消');
      }

      const fromStatus = order.status;
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      const savedOrder = await manager.save(RechargeOrder, order);
      await this.createEvent(
        manager,
        order.id,
        userId || null,
        userId ? 'user' : 'admin',
        'cancelled',
        { fromStatus, toStatus: 'cancelled', detail: '订单已取消' },
      );
      return savedOrder;
    });
  }

  async requestRefund(userId: number, id: number, reason: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(RechargeOrder, {
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException('充值订单不存在');
      }
      if (order.status !== 'paid') {
        throw new BadRequestException('只有已支付订单可以申请退款');
      }

      order.status = 'refund_pending';
      order.refundRequestedAt = new Date();
      order.refundReason = reason.trim();
      order.refundHandledAt = null;
      order.refundHandledBy = null;
      order.refundDecisionRemark = null;
      await manager.save(RechargeOrder, order);
      await this.createEvent(manager, id, userId, 'user', 'refund_requested', {
        fromStatus: 'paid',
        toStatus: 'refund_pending',
        detail: order.refundReason,
      });
      return order;
    });
  }

  async reviewRefund(
    id: number,
    adminUserId: number,
    approved: boolean,
    remark?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(RechargeOrder, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException('充值订单不存在');
      }
      if (order.status !== 'refund_pending') {
        throw new BadRequestException('只有待审核退款订单可以处理');
      }

      order.refundHandledAt = new Date();
      order.refundHandledBy = adminUserId;
      order.refundDecisionRemark = remark?.trim() || null;

      if (approved) {
        await this.pointsService.spendWithManager(
          manager,
          order.userId,
          order.totalPoints,
          {
            scene: 'recharge_refund',
            description: `充值退款扣回：${order.packageName}`,
            refType: 'recharge_order',
            refId: order.id,
          },
        );
        order.status = 'refunded';
        order.refundedAt = new Date();
      } else {
        order.status = 'paid';
      }

      await manager.save(RechargeOrder, order);
      await this.createEvent(
        manager,
        id,
        adminUserId,
        'admin',
        approved ? 'refund_approved' : 'refund_rejected',
        {
          fromStatus: 'refund_pending',
          toStatus: order.status,
          detail:
            remark?.trim() ||
            (approved ? '退款审核通过，积分已扣回' : '退款申请已驳回'),
        },
      );
      return order;
    });
  }

  async listOrderEvents(id: number, userId?: number) {
    if (userId) {
      const owned = await this.orderRepo.exist({ where: { id, userId } });
      if (!owned) throw new NotFoundException('充值订单不存在');
    } else if (!(await this.orderRepo.exist({ where: { id } }))) {
      throw new NotFoundException('充值订单不存在');
    }
    return this.orderEventRepo.find({
      where: { orderId: id },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async listAdminOrdersForExport(query: ListRechargeOrderDto) {
    const qb = this.buildOrderQuery(query);
    return qb.take(10000).getMany();
  }

  private async findPackage(id: number) {
    const pack = await this.packageRepo.findOne({ where: { id } });
    if (!pack) {
      throw new NotFoundException('充值套餐不存在');
    }
    return pack;
  }

  private async listOrders(query: ListRechargeOrderDto & { userId?: number }) {
    const page = this.normalizePositiveInteger(query.page, 1);
    const pageSize = Math.min(
      this.normalizePositiveInteger(query.pageSize, 20),
      100,
    );
    const qb = this.buildOrderQuery(query)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  private buildOrderQuery(query: ListRechargeOrderDto & { userId?: number }) {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.user', 'user')
      .addSelect(['user.id', 'user.username'])
      .orderBy('order.createdAt', 'DESC');

    if (query.userId) {
      qb.andWhere('order.userId = :userId', { userId: query.userId });
    }
    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }
    if (query.keyword?.trim()) {
      const keyword = `%${query.keyword.trim()}%`;
      qb.andWhere(
        '(order.orderNo LIKE :keyword OR order.packageName LIKE :keyword OR user.username LIKE :keyword)',
        { keyword },
      );
    }

    return qb;
  }

  private createEvent(
    manager: EntityManager,
    orderId: number,
    actorId: number | null,
    actorType: 'user' | 'admin' | 'system',
    action: string,
    options: { fromStatus?: string; toStatus?: string; detail?: string },
  ) {
    return manager.save(
      RechargeOrderEvent,
      manager.create(RechargeOrderEvent, {
        orderId,
        actorId,
        actorType,
        action,
        fromStatus: options.fromStatus || null,
        toStatus: options.toStatus || null,
        detail: options.detail || null,
      }),
    );
  }

  private normalizePositiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return parsed;
  }

  private generateOrderNo() {
    const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    return `R${timestamp}${randomBytes(4).toString('hex').toUpperCase()}`;
  }
}
