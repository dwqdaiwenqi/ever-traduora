import { Controller, Get, Param, Req, UseGuards, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectAction } from '../domain/actions';
import AuthorizationService from '../services/authorization.service';
import { ApiOAuth2, ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { ProjectPlanResponse } from '../domain/http';

@Controller('api/v1/activities')
@UseGuards(AuthGuard())
@ApiOAuth2([])
@ApiTags('Activity Plans')
export default class ProjectPlanController {
  constructor(private auth: AuthorizationService) {}

  @Get(':activityId/plan')
  @ApiOperation({ summary: `Get an activity's plan` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ProjectPlanResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async find(@Req() req, @Param('activityId') activityId: string) {
    const user = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    const membership = await this.auth.authorizeProjectAction(user, activityId, ProjectAction.ViewProjectPlan);
    return {
      data: membership.project.plan,
    };
  }
}
