import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

/**
 * 文件上传控制器
 */
@ApiTags('文件上传')
@Controller('upload')
export class UploadController {
  /**
   * 上传图片
   */
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('请选择文件');
    }

    // 验证文件类型
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      throw new BadRequestException('只支持图片格式');
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('文件大小不能超过 5MB');
    }

    // 生成安全随机文件名
    const filename = `${randomUUID()}${extname(file.originalname)}`;

    // 确保 uploads 目录存在
    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // 保存文件
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, file.buffer);

    return {
      filename,
      url: `/uploads/${filename}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
