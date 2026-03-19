import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';

@ApiTags('菜单管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @ApiOperation({ summary: '获取所有菜单（平铺）' })
  @Get('list')
  findAll() {
    return this.menuService.findAll();
  }

  @ApiOperation({ summary: '获取菜单树' })
  @Get('tree')
  findTree() {
    return this.menuService.findTree();
  }

  @ApiOperation({ summary: '创建菜单' })
  @Post('create')
  create(@Body() dto: CreateMenuDto) {
    return this.menuService.create(dto);
  }

  @ApiOperation({ summary: '更新菜单' })
  @Post('update/:id')
  update(@Param('id') id: string, @Body() dto: CreateMenuDto) {
    return this.menuService.update(+id, dto);
  }

  @ApiOperation({ summary: '删除菜单' })
  @Post('delete/:id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(+id);
  }
}
