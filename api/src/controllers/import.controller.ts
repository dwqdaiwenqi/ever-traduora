import * as _ from 'lodash';
import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectAction } from '../domain/actions';
import { IntermediateTranslation, IntermediateTranslationFormat } from '../domain/formatters';
import { ImportExportFormat, ImportQuery, ImportResponse } from '../domain/http';
import { Locale } from '../entity/locale.entity';
import { ProjectLocale } from '../entity/project-locale.entity';
import { Project } from '../entity/project.entity';
import { Term } from '../entity/term.entity';
import { Translation } from '../entity/translation.entity';
import { csvParser } from '../formatters/csv';
import { jsonFlatParser } from '../formatters/jsonflat';
import { jsonNestedParser } from '../formatters/jsonnested';
import { propertiesParser } from '../formatters/properties';
import { xliffParser } from '../formatters/xliff';
import { yamlFlatParser } from '../formatters/yaml-flat';
import { yamlNestedParser } from '../formatters/yaml-nested';
import AuthorizationService from '../services/authorization.service';
import { gettextParser } from '../formatters/gettext';
import { stringsParser } from '../formatters/strings';
import { ApiOAuth2, ApiConsumes, ApiResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { androidXmlParser } from '../formatters/android-xml';
import { phpParser } from '../formatters/php';
import { ApiFile } from './../decorators/api-file.decorator';
import { resXParser } from '../formatters/resx';
import { PaymentRequiredException } from './../errors';
import { ProjectRole } from '../entity/project-user.entity';
import { User } from '../entity/user.entity';
import { TranslationVersionService } from '../services/translation-version.service';

@Controller('api/v1/activities/:activityId/imports')
@ApiTags('Imports')
export class ImportController {
  constructor(
    private auth: AuthorizationService,
    @InjectRepository(Translation) private translationRepo: Repository<Translation>,
    @InjectRepository(Term) private termRepo: Repository<Term>,
    @InjectRepository(ProjectLocale) private projectLocaleRepo: Repository<ProjectLocale>,
    @InjectRepository(Locale) private localeRepo: Repository<Locale>,
    private versions: TranslationVersionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard())
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 1024 * 1024 } })) // 1024 KB max size
  @ApiOAuth2([])
  @ApiOperation({ summary: 'Import a translation file' })
  @ApiConsumes('multipart/form-data')
  @ApiFile('file')
  @ApiResponse({ status: HttpStatus.OK, description: 'File imported', type: ImportResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No such resource found' })
  @ApiResponse({ status: HttpStatus.PAYMENT_REQUIRED, description: 'Plan limit reached' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async import(@Req() req, @Param('activityId') activityId: string, @Query() query: ImportQuery, @UploadedFile('file') file) {
    if (!file) {
      throw new BadRequestException('missing file to import');
    }

    const user = this.auth.getRequestUserOrClient(req);

    // Authorize user for import
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.ImportTranslation, 0, 0);

    try {
      const locale = await this.localeRepo.findOneOrFail({ where: { code: query.locale } });

      const contents = file.buffer.toString('utf-8') as string;

      const incoming = await this.parse(query.format, contents);

      return await this.termRepo.manager.transaction(async entityManager => {
        let projectLocale: ProjectLocale | undefined = await entityManager.findOne(ProjectLocale, {
          where: { project: { id: membership.project.id }, locale: { code: locale.code } },
        });

        if (!projectLocale) {
          // Authorize if has access to project import and can add 1 locale
          await this.auth.authorizeProjectAction(user, activityId, ProjectAction.ImportTranslation, 0, 1);

          // Extract into service for creating project locales
          projectLocale = this.projectLocaleRepo.create({
            locale: locale,
            project: {
              id: membership.project.id,
            },
          });
          projectLocale = await entityManager.save(ProjectLocale, projectLocale);
          await entityManager.increment(Project, { id: membership.project.id }, 'localesCount', 1);
        }

        // Find existing terms and determine which terms to create
        const existingTerms = await entityManager.find(Term, {
          where: { project: { id: membership.project.id } },
        });

        // Resolve which terms / translations to add or update
        const termsToAdd = this.determineTermsToAdd(existingTerms, incoming.translations, membership.project);

        // Authorize if user would have enough terms left in plan for import
        await this.auth.authorizeProjectAction(user, activityId, ProjectAction.ImportTranslation, termsToAdd.length, 1);

        const addedTerms = await entityManager.save(Term, termsToAdd);
        const allTerms = [...addedTerms, ...existingTerms];

        const translationsToAdd = this.determineTranslationsToAdd(allTerms, incoming.translations, projectLocale);

        await entityManager.increment(Project, { id: membership.project.id }, 'termsCount', termsToAdd.length);

        // 开发（admin）导入的内容直接生效；运营（editor）导入的内容进入待开发确认
        if (membership.role === ProjectRole.Admin) {
          const previous = await entityManager.find(Translation, { where: { projectLocaleId: projectLocale.id } });
          const previousConfirmed = _.fromPairs(previous.map(t => [t.termId, t.confirmedValue ?? '']));
          const changed = translationsToAdd.filter(t => (previousConfirmed[t.termId] ?? '') !== t.value);
          translationsToAdd.forEach(t => (t.confirmedValue = t.value));
          await entityManager.save(Translation, translationsToAdd);
          const changedKeys = allTerms.filter(term => changed.some(t => t.termId === term.id)).map(term => term.value);
          await this.versions.saveSnapshot(entityManager, projectLocale.id, user instanceof User ? user.id : null, changedKeys);
        } else {
          await entityManager.save(Translation, translationsToAdd);
        }

        return {
          data: {
            terms: {
              added: termsToAdd.length,
              skipped: incoming.translations.length - termsToAdd.length,
            },
            translations: {
              upserted: translationsToAdd.length,
            },
          },
        };
      });
    } catch (error) {
      if (error instanceof PaymentRequiredException) {
        throw new PaymentRequiredException('request would exceed plan limit');
      } else {
        throw new NotFoundException();
      }
    }
  }

  private determineTermsToAdd(existing: Term[], incomingItems: IntermediateTranslation[], project: Project): Term[] {
    const existingTermsByValue: { [value: string]: Term } = existing.reduce((acc, term) => ({ ...acc, [term.value]: term }), {});

    const termsToAdd: Term[] = [];

    for (const incoming of incomingItems) {
      const existingTerm = existingTermsByValue[incoming.term];
      if (!existingTerm) {
        // If no term exists yet, create it
        const term = this.termRepo.create({
          project: project,
          value: incoming.term,
        });
        termsToAdd.push(term);
      }
    }

    return termsToAdd;
  }

  private determineTranslationsToAdd(allTerms: Term[], incomingItems: IntermediateTranslation[], projectLocale: ProjectLocale): Translation[] {
    const termsByValue: { [value: string]: Term } = allTerms.reduce((acc, term) => ({ ...acc, [term.value]: term }), {});

    const translationsToAdd: Translation[] = [];

    // Overwrite term in translation with saved one
    for (const translation of incomingItems) {
      const term = termsByValue[translation.term];
      if (!term) {
        throw new Error('missing term for translation');
      }

      translationsToAdd.push(
        this.translationRepo.create({
          termId: term.id,
          projectLocaleId: projectLocale.id,
          value: translation.translation,
        }),
      );
    }

    return translationsToAdd;
  }

  private async parse(format: ImportExportFormat, contents): Promise<IntermediateTranslationFormat> {
    try {
      switch (format) {
        case 'androidxml':
          return await androidXmlParser(contents);
        case 'csv':
          return await csvParser(contents);
        case 'xliff12':
          return await xliffParser({ version: '1.2' })(contents);
        case 'jsonflat':
          return await jsonFlatParser(contents);
        case 'jsonnested':
          return await jsonNestedParser(contents);
        case 'yamlflat':
          return await yamlFlatParser(contents);
        case 'yamlnested':
          return await yamlNestedParser(contents);
        case 'properties':
          return await propertiesParser(contents);
        case 'po':
          return await gettextParser(contents);
        case 'strings':
          return await stringsParser(contents);
        case 'php':
          return await phpParser(contents);
        case 'resx':
          return await resXParser(contents);
        default:
          throw new Error('Export format not implemented');
      }
    } catch (err) {
      throw new BadRequestException('Malformed import file');
    }
  }
}
