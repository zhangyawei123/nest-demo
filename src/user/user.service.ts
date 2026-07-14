import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../role/role.entity';

const ADMIN_INITIAL_POINTS = 1000;

/**
 * 用户服务 - 处理用户相关的业务逻辑
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  /**
   * 创建用户（注册）
   * 前端已对密码进行 MD5 加密，后端直接存储
   * @param createUserDto 用户注册信息（密码已 MD5）
   * @returns 新创建的用户对象
   * @throws ConflictException 用户名已存在
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    // 直接存储前端传来的 MD5 密码
    const user = this.userRepository.create({
      ...createUserDto,
      password: await this.hashPassword(createUserDto.password),
      points: this.getInitialPoints(createUserDto.username),
    });

    return this.userRepository.save(user);
  }

  /**
   * 根据用户名查找用户（登录时使用）
   * @param username 用户名
   * @returns 用户实体，不存在则返回 null
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles', 'roles.menus'],
    });
  }

  /**
   * 根据 ID 查找用户（JWT 验证时使用）
   * @param id 用户 ID
   * @returns 用户实体
   * @throws NotFoundException 用户不存在时抛出 404
   */
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.menus'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findAll(keyword?: string) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .orderBy('user.createdAt', 'DESC');

    if (keyword?.trim()) {
      queryBuilder.where('user.username LIKE :keyword', {
        keyword: `%${keyword.trim()}%`,
      });
    }

    const users = await queryBuilder.getMany();
    return users.map((user) => this.sanitizeUser(user));
  }

  async getMenusByUserId(id: number) {
    const user = await this.findById(id);
    const menuMap = new Map<number, any>();
    for (const role of user.roles || []) {
      for (const menu of role.menus || []) {
        menuMap.set(menu.id, menu);
      }
    }
    const allMenus = Array.from(menuMap.values());
    allMenus.sort((a, b) => a.sort - b.sort);

    // 构建树形结构
    return this.buildMenuTree(allMenus);
  }

  private buildMenuTree(menus: any[], parentId: number | null = null): any[] {
    return menus
      .filter((menu) => menu.parentId === parentId)
      .map((menu) => ({
        ...menu,
        children: this.buildMenuTree(menus, menu.id),
      }));
  }

  async assignRoles(id: number, roles: any[]): Promise<User> {
    const user = await this.findById(id);
    user.roles = roles;
    return this.userRepository.save(user);
  }

  async assignRoleIds(id: number, roleIds: number[]) {
    const user = await this.findById(id);
    user.roles = roleIds.length
      ? await this.roleRepository.findBy({ id: In(roleIds) })
      : [];
    await this.userRepository.save(user);
    return this.sanitizeUser(await this.findById(id));
  }

  /**
   * 更新用户信息（支持修改密码）
   * 前端已对新密码进行 MD5 加密，后端直接存储
   * @param id 要更新的用户 ID
   * @param updateUserDto 更新请求体（密码已 MD5）
   * @returns 更新后的用户实体
   * @throws NotFoundException 用户不存在时抛出 404
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // 直接保存前端传来的 MD5 密码
    const nextUser = { ...updateUserDto };
    if (nextUser.password) {
      nextUser.password = await this.hashPassword(nextUser.password);
    }

    Object.assign(user, nextUser);
    return this.userRepository.save(user);
  }

  /**
   * 验证密码是否匹配（登录时使用）
   * 前端传来的密码已 MD5，直接比较字符串
   * @param md5Password 前端传来的 MD5 密码
   * @param storedPassword 数据库中存储的 MD5 密码
   * @returns 匹配返回 true，不匹配返回 false
   */
  async validatePassword(
    md5Password: string,
    storedPassword: string,
  ): Promise<boolean> {
    if (this.isBcryptHash(storedPassword)) {
      return bcrypt.compare(md5Password, storedPassword);
    }

    return md5Password === storedPassword;
  }

  async migratePasswordHashIfNeeded(
    user: User,
    md5Password: string,
  ): Promise<void> {
    if (
      !user.password ||
      this.isBcryptHash(user.password) ||
      user.password !== md5Password
    ) {
      return;
    }

    const hashedPassword = await this.hashPassword(md5Password);
    await this.userRepository.update(user.id, { password: hashedPassword });
    user.password = hashedPassword;
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user as any;
    return result;
  }

  private isBcryptHash(password: string) {
    return /^\$2[aby]\$\d{2}\$/.test(password);
  }

  private hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private getInitialPoints(username: string) {
    return username.trim().toLowerCase() === 'admin' ? ADMIN_INITIAL_POINTS : 0;
  }
}
