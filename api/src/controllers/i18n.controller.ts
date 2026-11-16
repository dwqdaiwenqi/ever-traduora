import { Controller, Get, Header, HttpStatus, NotFoundException, Param, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { ProjectLocale } from '../entity/project-locale.entity';
import { TranslationVersionService } from '../services/translation-version.service';

/**
 * 给业务前端使用的公开读取接口，不需要登录。
 * 只返回开发已确认（已生效）的翻译，运营刚提交、还没确认的内容不会出现在这里。
 * projectId 是 uuid（一个活动一个项目），不可猜测。缺失的 key 不返回，由前端回退到国服文案。
 */
@Controller('api/v1/i18n/:projectId')
@ApiTags('I18n')
export class I18nController {
  constructor(
    private versions: TranslationVersionService,
    @InjectRepository(ProjectLocale) private projectLocaleRepo: Repository<ProjectLocale>,
  ) {}

  @Get(':localeCode')
  @Header('Cache-Control', 'no-cache')
  @ApiOperation({ summary: 'Get the confirmed (effective) translations of a locale as flat JSON' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success' })
  @ApiResponse({ status: HttpStatus.NOT_MODIFIED, description: 'Not modified' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project or locale not found' })
  async get(@Req() req, @Res() res, @Param('projectId') projectId: string, @Param('localeCode') localeCode: string) {
    const projectLocale = await this.projectLocaleRepo.findOne({
      where: { project: { id: projectId }, locale: { code: localeCode } },
    });
    if (!projectLocale) {
      throw new NotFoundException('project locale not found');
    }

    const content = await this.versions.buildEffectiveContent(this.projectLocaleRepo.manager, projectLocale.id);
    const body = JSON.stringify(content);
    // 应用全局关闭了 express 的 etag，这里自己算，前端带 If-None-Match 时返回 304
    const etag = `"${createHash('sha1').update(body).digest('hex')}"`;
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      return res.status(HttpStatus.NOT_MODIFIED).end();
    }
    return res.status(HttpStatus.OK).type('application/json').send(body);
  }
}
