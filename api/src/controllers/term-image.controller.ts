import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectAction } from '../domain/actions';
import { TermImage } from '../entity/term-image.entity';
import AuthorizationService from '../services/authorization.service';
import { ApiFile } from '../decorators/api-file.decorator';

/** 单张图片最大 2MB（截图一般远小于这个值） */
export const MAX_TERM_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * 按文件头判断真实图片类型，不信任客户端传来的 Content-Type。
 * 不允许 SVG：SVG 可以带脚本，直接在浏览器里打开有 XSS 风险。
 */
export function sniffImageType(buf: Buffer): string | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length >= 6 && ['GIF87a', 'GIF89a'].includes(buf.subarray(0, 6).toString('latin1'))) return 'image/gif';
  if (buf.length >= 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

@Controller('api/v1/activities/:activityId/term-images')
@ApiTags('Term images')
export class TermImageController {
  constructor(
    private auth: AuthorizationService,
    @InjectRepository(TermImage) private imageRepo: Repository<TermImage>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_TERM_IMAGE_BYTES } }))
  @ApiOAuth2([])
  @ApiOperation({ summary: 'Upload an image to use in term notes (png, jpeg, gif, webp; max 2MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiFile('file')
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Not an allowed image' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async upload(@Req() req, @Param('activityId') activityId: string, @UploadedFile('file') file) {
    const user = this.auth.getRequestUserOrClient(req);
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.EditTerm);

    if (!file?.buffer) {
      throw new BadRequestException('missing image');
    }
    const mimeType = sniffImageType(file.buffer);
    if (!mimeType) {
      throw new BadRequestException('only png, jpeg, gif and webp images are allowed');
    }

    const saved = await this.imageRepo.save(
      this.imageRepo.create({ project: { id: membership.project.id }, mimeType, size: file.buffer.length, data: file.buffer }),
    );
    return { data: { id: saved.id, mimeType, size: saved.size } };
  }

  /**
   * 不需要登录：<img> 标签没法带 Authorization 头。图片 id 是不可猜测的 uuid，并且必须和 activityId 匹配。
   */
  @Get(':imageId')
  @ApiOperation({ summary: 'Get an uploaded term image' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  async get(@Res() res, @Param('activityId') activityId: string, @Param('imageId') imageId: string) {
    const image = await this.imageRepo.findOne({ where: { id: imageId, project: { id: activityId } } });
    if (!image) {
      throw new NotFoundException('image not found');
    }
    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Content-Length', String(image.data.length));
    // 图片内容不会变（换图 = 新 id），可以长期缓存
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.status(HttpStatus.OK).end(image.data);
  }
}
