import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../role/role.entity';
import { Menu } from '../menu/menu.entity';

@ApiTags('用户管理')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  @ApiOperation({ summary: '获取用户列表' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('list')
  getUserList(@Query('keyword') keyword?: string) {
    return this.userService.findAll(keyword);
  }

  @ApiOperation({ summary: '查询用户信息' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('detail/:id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findById(+id);
    const { password, ...result } = user as any;
    return result;
  }

  @ApiOperation({ summary: '获取当前用户的菜单列表' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('menus')
  async getMyMenus(@Request() req) {
    return this.userService.getMenusByUserId(req.user.userId);
  }

  @ApiOperation({ summary: '修改用户信息' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('update/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    const userId = +id;
    if (req.user.userId !== userId) {
      throw new ForbiddenException('只能修改自己的信息');
    }
    return this.userService.update(userId, updateUserDto);
  }

  @ApiOperation({ summary: '分配角色给用户' })
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Post('assign-roles/:id')
  assignRoles(@Param('id') id: string, @Body('roleIds') roleIds: number[] = []) {
    return this.userService.assignRoleIds(+id, roleIds);
  }

  @ApiOperation({ summary: '重置 admin 密码为 admin（临时接口）' })
  @Post('reset-admin-password')
  async resetAdminPassword() {
    const admin = await this.userService.findByUsername('admin');
    if (!admin) {
      return { message: 'admin 用户不存在' };
    }
    await this.userService.update(admin.id, { password: '21232f297a57a5a743894a0e4a801fc3' });
    return { message: 'admin 密码已重置为 admin (MD5)' };
  }

  @ApiOperation({ summary: '初始化菜单数据并给 admin 分配最高权限（仅首次使用）' })
  @Post('seed')
  async seed() {
    // 顶级菜单
    const topMenus = [
      { name: '仪表盘', path: '/', component: 'dashboard/DashboardView', icon: 'HomeFilled', sort: 0 },
      { name: '文章管理', path: '/articles', component: 'article/ArticleListView', icon: 'Document', sort: 1 },
      { name: '用户管理', path: '/users', component: 'user/UsersView', icon: 'User', sort: 2 },
      { name: '角色管理', path: '/roles', component: 'role/RoleView', icon: 'UserFilled', sort: 3 },
      { name: '菜单管理', path: '/menus', component: 'menu/MenuView', icon: 'Grid', sort: 4 },
      { name: '幸运转盘', path: '/lottery', component: 'lottery/LotteryView', icon: 'Opportunity', sort: 5 },
      { name: '通知公告', path: '/notice', component: 'notice/NoticeView', icon: 'Bell', sort: 6 },
      { name: '操作日志', path: '/operation-log', component: 'operation-log/OperationLogView', icon: 'Memo', sort: 7 },
    ];

    const savedMenus: Menu[] = [];
    for (const m of topMenus) {
      let menu = await this.menuRepository.findOne({ where: { path: m.path } });
      if (!menu) {
        menu = this.menuRepository.create({ ...m, visible: true });
        menu = await this.menuRepository.save(menu);
      }
      savedMenus.push(menu);
    }

    // 文章管理的子菜单（嵌套路由）
    const articleMenu = savedMenus.find(m => m.path === '/articles');
    if (articleMenu) {
      const articleSubMenus = [
        { name: '发布文章', path: 'create', component: 'article/ArticleEditView', icon: '', sort: 0, visible: false, parentId: articleMenu.id },
        { name: '编辑文章', path: 'edit', component: 'article/ArticleEditView', icon: '', sort: 1, visible: false, parentId: articleMenu.id },
        { name: '文章详情', path: 'detail', component: 'article/ArticleDetailView', icon: '', sort: 2, visible: false, parentId: articleMenu.id },
      ];

      for (const m of articleSubMenus) {
        let menu = await this.menuRepository.findOne({ where: { name: m.name } });
        if (!menu) {
          menu = this.menuRepository.create(m);
          menu = await this.menuRepository.save(menu);
        } else {
          Object.assign(menu, m);
          menu = await this.menuRepository.save(menu);
        }
        savedMenus.push(menu);
      }
    }

    let adminRole = await this.roleRepository.findOne({ where: { name: 'admin' }, relations: ['menus'] });
    if (!adminRole) {
      adminRole = this.roleRepository.create({ name: 'admin', description: '超级管理员，拥有所有权限' });
    }
    const allMenus = await this.menuRepository.find();
    adminRole.menus = allMenus;
    await this.roleRepository.save(adminRole);

    const adminUser = await this.userService.findByUsername('admin');
    if (adminUser) {
      await this.userService.assignRoles(adminUser.id, [adminRole]);
    }

    return { message: '初始化完成', menus: allMenus.length, role: adminRole.name };
  }
}
