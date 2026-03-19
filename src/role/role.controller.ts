import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignMenusDto } from './dto/assign-menus.dto';

@ApiTags('角色管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiOperation({ summary: '获取所有角色' })
  @Get('list')
  findAll() {
    return this.roleService.findAll();
  }

  @ApiOperation({ summary: '获取角色详情' })
  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(+id);
  }

  @ApiOperation({ summary: '创建角色' })
  @Post('create')
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @ApiOperation({ summary: '更新角色' })
  @Post('update/:id')
  update(@Param('id') id: string, @Body() dto: CreateRoleDto) {
    return this.roleService.update(+id, dto);
  }

  @ApiOperation({ summary: '删除角色' })
  @Post('delete/:id')
  remove(@Param('id') id: string) {
    return this.roleService.remove(+id);
  }

  @ApiOperation({ summary: '分配菜单给角色' })
  @Post('assign-menus/:id')
  assignMenus(@Param('id') id: string, @Body() dto: AssignMenusDto) {
    return this.roleService.assignMenus(+id, dto.menuIds);
  }
}
