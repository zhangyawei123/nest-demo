import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VisionService } from './vision.service';

@ApiTags('视觉能力')
@Controller('vision')
@UseGuards(JwtAuthGuard)
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @ApiOperation({ summary: '人脸识别' })
  @ApiConsumes('multipart/form-data')
  @Post('face-detect')
  @UseInterceptors(FileInterceptor('file'))
  async faceDetect(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('请选择图片');
    }
    return this.visionService.detectFaces(file);
  }

  @ApiOperation({ summary: '图片分析菜谱并生成套餐建议' })
  @ApiConsumes('multipart/form-data')
  @Post('recipe-combo')
  @UseInterceptors(FileInterceptor('file'))
  async recipeCombo(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('请选择图片');
    }
    return this.visionService.analyzeRecipeCombo(file);
  }
}
