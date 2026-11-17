import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import * as _ from 'lodash';
import { Repository } from 'typeorm';
import { ProjectAction } from '../domain/actions';
import { ProjectRole } from '../entity/project-user.entity';
import { TranslationVersionService } from '../services/translation-version.service';
import {
  AddLocaleRequest,
  ConfirmTranslationsRequest,
  ListProjectLocalesResponse,
  ListTermTranslatonsResponse,
  ProjectLocaleResponse,
  TermTranslatonResponse,
  UpdateTranslationRequest,
} from '../domain/http';
import { Locale } from '../entity/locale.entity';
import { ProjectLocale } from '../entity/project-locale.entity';
import { Project } from '../entity/project.entity';
import { Term } from '../entity/term.entity';
import { Translation } from '../entity/translation.entity';
import { User } from '../entity/user.entity';
import AuthorizationService from '../services/authorization.service';

@Controller('api/v1/activities/:activityId/translations')
@UseGuards(AuthGuard())
@ApiOAuth2([])
@ApiTags('Translations')
export default class TranslationController {
  constructor(
    private auth: AuthorizationService,
    @InjectRepository(Translation) private translationRepo: Repository<Translation>,
    @InjectRepository(ProjectLocale) private projectLocaleRepo: Repository<ProjectLocale>,
    @InjectRepository(Term) private termRepo: Repository<Term>,
    @InjectRepository(Locale) private localeRepo: Repository<Locale>,
    private versions: TranslationVersionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all translation locales for an activity' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ListProjectLocalesResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async find(@Req() req, @Param('activityId') activityId: string) {
    const user = this.auth.getRequestUserOrClient(req);
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.ViewTranslation);
    const locales = await this.projectLocaleRepo.find({
      where: {
        project: { id: membership.project.id },
      },
      relations: ['locale'],
    });

    // 每个语言有多少条翻译处于"待确认"（运营填写的值和已生效的值不一致）
    const pendingCounts: { [projectLocaleId: string]: number } = {};
    if (locales.length > 0) {
      const rows = await this.translationRepo
        .createQueryBuilder('t')
        .select('t.projectLocaleId', 'projectLocaleId')
        .addSelect('COUNT(*)', 'count')
        .where('t.projectLocaleId IN (:...ids)', { ids: locales.map(l => l.id) })
        .andWhere("t.value <> COALESCE(t.confirmedValue, '')")
        .groupBy('t.projectLocaleId')
        .getRawMany();
      for (const row of rows) {
        pendingCounts[row.projectLocaleId] = Number(row.count);
      }
    }

    return {
      data: locales.map(v => ({
        ..._.pick(v, ['id', 'date', 'locale.code', 'locale.region', 'locale.language']),
        pendingCount: pendingCounts[v.id] ?? 0,
      })),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new translation locale for an activity' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ProjectLocaleResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity not found' })
  @ApiResponse({ status: HttpStatus.PAYMENT_REQUIRED, description: 'Plan limit reached' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(@Req() req, @Param('activityId') activityId: string, @Body() payload: AddLocaleRequest) {
    const user = this.auth.getRequestUserOrClient(req);
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.AddTranslation, 0, 1);

    const locale = await this.localeRepo.findOneBy({ code: payload.code });

    if (!locale) {
      throw new NotFoundException('unknown locale code');
    }

    const projectLocale = this.projectLocaleRepo.create({
      locale: locale,
      project: membership.project,
    });

    await this.termRepo.manager.transaction(async entityManager => {
      await entityManager.save(projectLocale);
      const terms = await entityManager.find(Term, { where: { project: { id: activityId } } });
      const translations = terms.map(term =>
        this.translationRepo.create({
          projectLocale: projectLocale,
          term: term,
          value: '',
        }),
      );
      await entityManager.save(translations);
      await entityManager.increment(Project, { id: membership.project.id }, 'localesCount', 1);
    });

    const result = await this.projectLocaleRepo.findOneByOrFail({
      locale: {
        code: locale.code,
      },
      project: { id: membership.project.id },
    });

    return {
      data: {
        id: result.id,
        locale: {
          code: projectLocale.locale.code,
          region: projectLocale.locale.region,
          language: projectLocale.locale.language,
        },
        date: result.date,
      },
    };
  }

  @Get(':localeCode')
  @ApiOperation({ summary: `List translated terms for a locale` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ListTermTranslatonsResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async findOne(@Req() req, @Param('activityId') activityId: string, @Param('localeCode') localeCode: string) {
    const user = this.auth.getRequestUserOrClient(req);
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.ViewTranslation);

    try {
      // Ensure locale is requested project locale
      const projectLocale = await this.projectLocaleRepo.findOneOrFail({
        where: {
          project: { id: membership.project.id },
          locale: {
            code: localeCode,
          },
        },
      });
      try {
        const translations = await this.translationRepo.find({
          where: {
            projectLocale: {
              id: projectLocale.id,
            },
          },
          relations: ['term'],
        });
        const result = translations
          .filter(t => !!t.term)
          .map(t => ({ termId: t.term.id, value: t.value, confirmedValue: t.confirmedValue ?? '', date: t.date }));
        return { data: result };
      } catch (error) {
        throw new NotFoundException('activity translation not found');
      }
    } catch (error) {
      throw new NotFoundException('activity locale not found');
    }
  }

  @Patch(':localeCode')
  @ApiOperation({ summary: `Update a term's translation` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated', type: TermTranslatonResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity or locale not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async update(
    @Req() req,
    @Param('activityId') activityId: string,
    @Param('localeCode') localeCode: string,
    @Body() payload: UpdateTranslationRequest,
  ) {
    const user = this.auth.getRequestUserOrClient(req);
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.EditTranslation);
    // 开发（admin）自己填写的内容直接生效；运营（editor）填写的内容进入待确认
    const autoConfirm = membership.role === ProjectRole.Admin;

    try {
      const projectLocale = await this.projectLocaleRepo.findOneOrFail({
        where: {
          locale: {
            code: localeCode,
          },
          project: {
            id: activityId,
          },
        },
      });
      try {
        const term = await this.termRepo.findOneOrFail({
          where: {
            project: { id: activityId },
            id: payload.termId,
          },
        });
        let translation = await this.translationRepo.findOne({
          where: {
            termId: term.id,
            projectLocale: {
              id: projectLocale.id,
            },
          },
        });
        if (translation) {
          translation.value = payload.value;
        } else {
          translation = this.translationRepo.create({
            value: payload.value,
            projectLocale,
            term,
          });
        }

        await this.translationRepo.manager.transaction(async em => {
          const changesEffectiveValue = autoConfirm && (translation.confirmedValue ?? '') !== payload.value;
          if (autoConfirm) {
            translation.confirmedValue = payload.value;
          }
          await em.save(translation);
          if (changesEffectiveValue) {
            await this.versions.saveSnapshot(em, projectLocale.id, user instanceof User ? user.id : null, [term.value]);
          }
        });
        return {
          data: {
            termId: term.id,
            value: translation.value,
            confirmedValue: translation.confirmedValue ?? '',
            date: translation.date,
          },
        };
      } catch (error) {
        throw new NotFoundException('activity term not found');
      }
    } catch (error) {
      throw new NotFoundException('activity locale not found');
    }
  }

  @Post(':localeCode/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: `Confirm pending translations of a locale`,
    description: `Only admins can confirm. A translation is only confirmed if its current value still equals the value the admin saw; otherwise it is skipped.`,
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Confirmed' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity or locale not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async confirm(
    @Req() req,
    @Param('activityId') activityId: string,
    @Param('localeCode') localeCode: string,
    @Body() payload: ConfirmTranslationsRequest,
  ) {
    const user = this.auth.getRequestUserOrClient(req);
    await this.auth.authorizeProjectAction(user, activityId, ProjectAction.ConfirmTranslation);

    const projectLocale = await this.projectLocaleRepo.findOne({
      where: { project: { id: activityId }, locale: { code: localeCode } },
    });
    if (!projectLocale) {
      throw new NotFoundException('activity locale not found');
    }

    return await this.translationRepo.manager.transaction(async em => {
      const rows = await em.find(Translation, { where: { projectLocaleId: projectLocale.id }, relations: ['term'] });
      const byTermId = _.keyBy(
        rows.filter(r => !!r.term),
        r => r.term.id,
      );

      const confirmedKeys: string[] = [];
      let skipped = 0;
      for (const item of payload.items) {
        const row = byTermId[item.termId];
        // 不存在、已经不是待确认、或者运营在开发看到之后又改了：都跳过
        if (!row || row.value !== item.value || (row.confirmedValue ?? '') === row.value) {
          skipped++;
          continue;
        }
        row.confirmedValue = row.value;
        await em.save(row);
        confirmedKeys.push(row.term.value);
      }

      const version = await this.versions.saveSnapshot(em, projectLocale.id, user instanceof User ? user.id : null, confirmedKeys);
      return { data: { confirmed: confirmedKeys.length, skipped, version } };
    });
  }

  @Delete(':localeCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: `Delete an activity's locale`, description: `Deletes an activity's locale and all related translations` })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity or locale not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async delete(@Req() req, @Param('activityId') activityId: string, @Param('localeCode') localeCode: string) {
    const user = this.auth.getRequestUserOrClient(req);
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.DeleteTranslation);

    await this.projectLocaleRepo.manager.transaction(async entityManager => {
      const projectLocale = await entityManager.findOneOrFail(ProjectLocale, {
        where: {
          project: { id: membership.project.id },
          locale: {
            code: localeCode,
          },
        },
      });
      await entityManager.remove(projectLocale);
      await entityManager.decrement(Project, { id: membership.project.id }, 'localesCount', 1);
    });
  }
}
