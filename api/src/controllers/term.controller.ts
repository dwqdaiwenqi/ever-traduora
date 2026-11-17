import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectAction } from '../domain/actions';
import { AddTermRequest, UpdateTermRequest, ListProjectTermsResponse, ProjectTermResponse } from '../domain/http';
import { Project } from '../entity/project.entity';
import { Term } from '../entity/term.entity';
import AuthorizationService from '../services/authorization.service';
import { ApiOAuth2, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Translation } from '../entity/translation.entity';
import { getLexicalOrderClause, TERM_POSITION_ORDER } from '../utils/database-type-helper';
import { ProjectLocale } from '../entity/project-locale.entity';

@Controller('api/v1/activities/:activityId/terms')
@UseGuards(AuthGuard())
@ApiOAuth2([])
@ApiTags('Terms')
export default class TermController {
  constructor(
    private auth: AuthorizationService,
    @InjectRepository(Term) private termRepo: Repository<Term>,
    @InjectRepository(Translation) private translationRepo: Repository<Translation>,
    @InjectRepository(ProjectLocale) private projectLocaleRepo: Repository<ProjectLocale>,
  ) {}

  @Get()
  @ApiOperation({ summary: `List an activity's terms` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ListProjectTermsResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async find(@Req() req, @Param('activityId') activityId: string) {
    const user = this.auth.getRequestUserOrClient(req);
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.ViewTerm);

    // Use query builder for consistent sorting across databases
    const queryBuilder = this.termRepo
      .createQueryBuilder('term')
      .where('term.project.id = :activityId', { activityId: membership.project.id });

    // Apply database-specific collation for consistent lexical ordering
    queryBuilder.orderBy(TERM_POSITION_ORDER, 'ASC').addOrderBy(getLexicalOrderClause('term.value'), 'ASC');

    const terms = await queryBuilder.getMany();

    const data = terms.map(t => ({
      id: t.id,
      value: t.value,
      context: t.context,
      date: t.date,
    }));

    return {
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new activity term' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ProjectTermResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity not found' })
  @ApiResponse({ status: HttpStatus.PAYMENT_REQUIRED, description: 'Plan limit reached' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(@Req() req, @Param('activityId') activityId: string, @Body() payload: AddTermRequest) {
    const user = this.auth.getRequestUserOrClient(req);
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.AddTerm, 1);

    const term = this.termRepo.create({
      value: payload.value,
      context: payload.context,
      project: membership.project,
    });

    await this.termRepo.manager.transaction(async entityManager => {
      // 新增的词条排在已有词条后面
      const last = await entityManager
        .createQueryBuilder(Term, 'term')
        .select('MAX(term.position)', 'max')
        .where('term.project.id = :projectId', { projectId: membership.project.id })
        .getRawOne();
      term.position = last?.max == null ? null : Number(last.max) + 1;
      await entityManager.save(term);

      const projectLocales = await this.projectLocaleRepo.find({
        where: {
          project: {
            id: membership.project.id,
          },
        },
      });

      const translations = projectLocales.map(projectLocale =>
        this.translationRepo.create({
          projectLocale: projectLocale,
          term: term,
          value: '',
        }),
      );
      await entityManager.save(translations);

      await entityManager.increment(Project, { id: membership.project.id }, 'termsCount', 1);
    });

    return {
      data: {
        id: term.id,
        value: term.value,
        context: term.context,
        date: term.date,
      },
    };
  }

  @Patch(':termId')
  @ApiOperation({ summary: `Update an activity's term` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated', type: ProjectTermResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async update(@Req() req, @Param('activityId') activityId: string, @Param('termId') termId: string, @Body() payload: UpdateTermRequest) {
    const user = this.auth.getRequestUserOrClient(req);

    await this.auth.authorizeProjectAction(user, activityId, ProjectAction.EditTerm);

    // Ensure is project term
    await this.termRepo.findOneOrFail({ where: { id: termId, project: { id: activityId } } });

    await this.termRepo.update({ id: termId }, { value: payload.value, context: payload.context });

    const term = await this.termRepo.findOneOrFail({ where: { id: termId } });

    return {
      data: {
        id: term.id,
        value: term.value,
        context: term.context,
        date: term.date,
      },
    };
  }

  @Delete(':termId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: `Remove an activity's term`, description: `Removes an activity's term and all related translations` })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Deleted' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async delete(@Req() req, @Param('activityId') activityId: string, @Param('termId') termId: string) {
    const user = this.auth.getRequestUserOrClient(req);
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.DeleteTerm);
    await this.termRepo.manager.transaction(async entityManager => {
      const term = await entityManager.findOneOrFail(Term, { where: { id: termId, project: { id: membership.project.id } } });
      await entityManager.remove(term);
      await entityManager.decrement(Project, { id: membership.project.id }, 'termsCount', 1);
    });
  }
}
