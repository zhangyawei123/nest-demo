import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * 用户服务 - 处理用户相关的业务逻辑
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
    const user = this.userRepository.create(createUserDto);

    return this.userRepository.save(user);
  }

  /**
   * 根据用户名查找用户（登录时使用）
   * @param username 用户名
   * @returns 用户实体，不存在则返回 null
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username }, relations: ['roles', 'roles.menus'] });
  }

  /**
   * 根据 ID 查找用户（JWT 验证时使用）
   * @param id 用户 ID
   * @returns 用户实体
   * @throws NotFoundException 用户不存在时抛出 404
   */
  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['roles', 'roles.menus'] });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async getMenusByUserId(id: number) {
    const user = await this.findById(id);
    const menuMap = new Map<number, any>();
    for (const role of (user.roles || [])) {
      for (const menu of (role.menus || [])) {
        menuMap.set(menu.id, menu);
      }
    }
    const menus = Array.from(menuMap.values());
    menus.sort((a, b) => a.sort - b.sort);
    return menus;
  }

  async assignRoles(id: number, roles: any[]): Promise<User> {
    const user = await this.findById(id);
    user.roles = roles;
    return this.userRepository.save(user);
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
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  /**
   * 验证密码是否匹配（登录时使用）
   * 前端传来的密码已 MD5，直接比较字符串
   * @param md5Password 前端传来的 MD5 密码
   * @param storedPassword 数据库中存储的 MD5 密码
   * @returns 匹配返回 true，不匹配返回 false
   */
  async validatePassword(md5Password: string, storedPassword: string): Promise<boolean> {
    return md5Password === storedPassword;
  }
}
