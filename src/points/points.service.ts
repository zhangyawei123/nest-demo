import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { DailySignIn } from './daily-sign-in.entity';
import { PointLog } from './point-log.entity';

export const POINT_COSTS = {
  DRAW_GENERATION: 2,
  AI_CHAT: 1,
  DAILY_SIGN_IN: 2,
} as const;

const ADMIN_UNLIMITED_POINTS = 999999999;

interface PointChangeOptions {
  scene: string;
  description?: string;
  refType?: string;
  refId?: number;
}

@Injectable()
export class PointsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PointLog)
    private readonly pointLogRepo: Repository<PointLog>,
    @InjectRepository(DailySignIn)
    private readonly signInRepo: Repository<DailySignIn>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.findUser(userId);
    const admin = this.isAdminUser(user);
    const today = this.todayInShanghai();
    const signedInToday = await this.signInRepo.exist({
      where: { userId, signDate: today },
    });

    return {
      points: admin ? ADMIN_UNLIMITED_POINTS : user.points || 0,
      isUnlimited: admin,
      makeupSignInChances: admin
        ? ADMIN_UNLIMITED_POINTS
        : user.makeupSignInChances || 0,
      signedInToday: admin ? true : signedInToday,
      currentStreak: await this.calculateCurrentStreak(
        this.signInRepo.manager,
        userId,
      ),
      todaySignInPoints: POINT_COSTS.DAILY_SIGN_IN,
      costs: {
        drawGeneration: POINT_COSTS.DRAW_GENERATION,
        aiChat: POINT_COSTS.AI_CHAT,
      },
    };
  }

  async signIn(userId: number) {
    const today = this.todayInShanghai();

    return this.dataSource.transaction(async (manager) => {
      const user = await this.findUserForUpdate(manager, userId);
      if (this.isAdminUser(user)) {
        return {
          signedIn: true,
          alreadySignedIn: true,
          points: ADMIN_UNLIMITED_POINTS,
          isUnlimited: true,
          earned: 0,
          signDate: today,
          currentStreak: 0,
          awardedMakeupChance: false,
          makeupSignInChances: ADMIN_UNLIMITED_POINTS,
        };
      }

      const existed = await manager.findOne(DailySignIn, {
        where: { userId, signDate: today },
      });

      if (existed) {
        return {
          signedIn: true,
          alreadySignedIn: true,
          points: user.points || 0,
          earned: 0,
          signDate: today,
        };
      }

      user.points = (user.points || 0) + POINT_COSTS.DAILY_SIGN_IN;
      await manager.save(User, user);
      await manager.save(
        DailySignIn,
        manager.create(DailySignIn, {
          userId,
          signDate: today,
          points: POINT_COSTS.DAILY_SIGN_IN,
          isMakeup: false,
        }),
      );
      await this.createLog(manager, user, POINT_COSTS.DAILY_SIGN_IN, {
        type: 'earn',
        scene: 'daily_sign_in',
        description: '每日签到',
      });

      const currentStreak = await this.calculateCurrentStreak(
        manager,
        userId,
        today,
      );
      const awardedMakeupChance = currentStreak > 0 && currentStreak % 7 === 0;
      if (awardedMakeupChance) {
        user.makeupSignInChances = (user.makeupSignInChances || 0) + 1;
        await manager.save(User, user);
      }

      return {
        signedIn: true,
        alreadySignedIn: false,
        points: user.points,
        earned: POINT_COSTS.DAILY_SIGN_IN,
        signDate: today,
        currentStreak,
        awardedMakeupChance,
        makeupSignInChances: user.makeupSignInChances || 0,
      };
    });
  }

  async makeupSignIn(userId: number, signDate: string) {
    const normalizedDate = this.normalizeDateString(signDate);
    const today = this.todayInShanghai();
    if (!normalizedDate) {
      throw new BadRequestException('补签日期格式应为 YYYY-MM-DD');
    }
    if (normalizedDate >= today) {
      throw new BadRequestException('只能补签今天之前的日期');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = await this.findUserForUpdate(manager, userId);
      if (this.isAdminUser(user)) {
        return {
          signedIn: true,
          makeup: true,
          signDate: normalizedDate,
          points: ADMIN_UNLIMITED_POINTS,
          isUnlimited: true,
          earned: 0,
          makeupSignInChances: ADMIN_UNLIMITED_POINTS,
          currentStreak: 0,
        };
      }

      if ((user.makeupSignInChances || 0) <= 0) {
        throw new BadRequestException('暂无补签机会');
      }

      const existed = await manager.findOne(DailySignIn, {
        where: { userId, signDate: normalizedDate },
      });
      if (existed) {
        throw new BadRequestException('该日期已签到');
      }

      user.makeupSignInChances = (user.makeupSignInChances || 0) - 1;
      user.points = (user.points || 0) + POINT_COSTS.DAILY_SIGN_IN;
      await manager.save(User, user);
      await manager.save(
        DailySignIn,
        manager.create(DailySignIn, {
          userId,
          signDate: normalizedDate,
          points: POINT_COSTS.DAILY_SIGN_IN,
          isMakeup: true,
        }),
      );
      await this.createLog(manager, user, POINT_COSTS.DAILY_SIGN_IN, {
        type: 'earn',
        scene: 'makeup_sign_in',
        description: `补签 ${normalizedDate}`,
      });

      return {
        signedIn: true,
        makeup: true,
        signDate: normalizedDate,
        points: user.points,
        earned: POINT_COSTS.DAILY_SIGN_IN,
        makeupSignInChances: user.makeupSignInChances || 0,
        currentStreak: await this.calculateCurrentStreak(
          manager,
          userId,
          today,
        ),
      };
    });
  }

  async getCalendar(userId: number, month?: string) {
    const targetMonth =
      this.normalizeMonthString(month) || this.currentMonthInShanghai();
    const [year, monthNumber] = targetMonth.split('-').map(Number);
    const firstDate = `${targetMonth}-01`;
    const lastDate = this.formatDate(new Date(Date.UTC(year, monthNumber, 0)));
    const today = this.todayInShanghai();
    const user = await this.findUser(userId);
    const rows = await this.signInRepo
      .createQueryBuilder('sign')
      .where('sign.userId = :userId', { userId })
      .andWhere('sign.signDate BETWEEN :firstDate AND :lastDate', {
        firstDate,
        lastDate,
      })
      .orderBy('sign.signDate', 'ASC')
      .getMany();
    const signMap = new Map(rows.map((row) => [row.signDate, row]));
    const days = Array.from(
      { length: Number(lastDate.slice(8, 10)) },
      (_, index) => {
        const date = `${targetMonth}-${String(index + 1).padStart(2, '0')}`;
        const record = signMap.get(date);
        return {
          date,
          day: index + 1,
          signedIn: !!record,
          isMakeup: !!record?.isMakeup,
          points: record?.points || 0,
          isToday: date === today,
          isPast: date < today,
          isFuture: date > today,
        };
      },
    );

    return {
      month: targetMonth,
      points: this.isAdminUser(user)
        ? ADMIN_UNLIMITED_POINTS
        : user.points || 0,
      isUnlimited: this.isAdminUser(user),
      makeupSignInChances: this.isAdminUser(user)
        ? ADMIN_UNLIMITED_POINTS
        : user.makeupSignInChances || 0,
      currentStreak: await this.calculateCurrentStreak(
        this.signInRepo.manager,
        userId,
        today,
      ),
      days,
    };
  }

  async findLogs(userId: number, page = 1, pageSize = 20) {
    const normalizedPage = this.normalizePositiveInteger(page, 1);
    const normalizedPageSize = Math.min(
      this.normalizePositiveInteger(pageSize, 20),
      100,
    );
    const [list, total] = await this.pointLogRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize,
    });

    return {
      list,
      total,
      page: normalizedPage,
      pageSize: normalizedPageSize,
    };
  }

  async spend(userId: number, amount: number, options: PointChangeOptions) {
    if (amount <= 0) {
      throw new BadRequestException('积分消耗数量必须大于 0');
    }

    return this.dataSource.transaction((manager) =>
      this.spendWithManager(manager, userId, amount, options),
    );
  }

  async spendWithManager(
    manager: EntityManager,
    userId: number,
    amount: number,
    options: PointChangeOptions,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('积分消耗数量必须大于 0');
    }

    const user = await this.findUserForUpdate(manager, userId);
    if (this.isAdminUser(user)) {
      return {
        points: ADMIN_UNLIMITED_POINTS,
        isUnlimited: true,
        spent: 0,
      };
    }

    const currentPoints = user.points || 0;
    if (currentPoints < amount) {
      throw new HttpException(
        `积分不足，当前 ${currentPoints} 积分，需要 ${amount} 积分`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    user.points = currentPoints - amount;
    await manager.save(User, user);
    await this.createLog(manager, user, -amount, {
      ...options,
      type: 'spend',
    });

    return { points: user.points, spent: amount };
  }

  async refund(userId: number, amount: number, options: PointChangeOptions) {
    if (amount <= 0) return null;

    return this.dataSource.transaction(async (manager) => {
      const user = await this.findUserForUpdate(manager, userId);
      if (this.isAdminUser(user)) {
        return {
          points: ADMIN_UNLIMITED_POINTS,
          isUnlimited: true,
          refunded: 0,
        };
      }

      user.points = (user.points || 0) + amount;
      await manager.save(User, user);
      await this.createLog(manager, user, amount, {
        ...options,
        type: 'refund',
      });

      return { points: user.points, refunded: amount };
    });
  }

  async earn(userId: number, amount: number, options: PointChangeOptions) {
    return this.dataSource.transaction((manager) =>
      this.earnWithManager(manager, userId, amount, options),
    );
  }

  async earnWithManager(
    manager: EntityManager,
    userId: number,
    amount: number,
    options: PointChangeOptions,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('积分增加数量必须大于 0');
    }

    const user = await this.findUserForUpdate(manager, userId);
    if (this.isAdminUser(user)) {
      return {
        points: ADMIN_UNLIMITED_POINTS,
        isUnlimited: true,
        earned: 0,
      };
    }

    user.points = (user.points || 0) + amount;
    await manager.save(User, user);
    await this.createLog(manager, user, amount, {
      ...options,
      type: 'earn',
    });

    return { points: user.points, earned: amount };
  }

  private async findUser(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  private async findUserForUpdate(manager: EntityManager, userId: number) {
    const user = await manager.findOne(User, {
      where: { id: userId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  private isAdminUser(user: User) {
    return user.username?.trim().toLowerCase() === 'admin';
  }

  private createLog(
    manager: EntityManager,
    user: User,
    amount: number,
    options: PointChangeOptions & { type: string },
  ) {
    return manager.save(
      PointLog,
      manager.create(PointLog, {
        userId: user.id,
        amount,
        balanceAfter: user.points || 0,
        type: options.type,
        scene: options.scene,
        description: options.description || null,
        refType: options.refType || null,
        refId: options.refId || null,
      }),
    );
  }

  private todayInShanghai() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private currentMonthInShanghai() {
    return this.todayInShanghai().slice(0, 7);
  }

  private normalizeMonthString(month?: string) {
    const value = String(month || '').trim();
    if (!/^\d{4}-\d{2}$/.test(value)) return '';
    const monthNumber = Number(value.slice(5, 7));
    if (monthNumber < 1 || monthNumber > 12) return '';
    return value;
  }

  private normalizeDateString(date?: string) {
    const value = String(date || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const parsed = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) return '';
    return this.formatDate(parsed) === value ? value : '';
  }

  private formatDate(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private addDays(date: string, days: number) {
    const parsed = new Date(`${date}T00:00:00Z`);
    parsed.setUTCDate(parsed.getUTCDate() + days);
    return this.formatDate(parsed);
  }

  private async calculateCurrentStreak(
    manager: EntityManager,
    userId: number,
    endDate = this.todayInShanghai(),
  ) {
    let cursor = endDate;
    let streak = 0;

    while (true) {
      const existed = await manager.findOne(DailySignIn, {
        where: { userId, signDate: cursor },
      });
      if (!existed) return streak;
      streak += 1;
      cursor = this.addDays(cursor, -1);
    }
  }

  private normalizePositiveInteger(value: unknown, fallback: number) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return fallback;
    }
    return parsed;
  }
}
