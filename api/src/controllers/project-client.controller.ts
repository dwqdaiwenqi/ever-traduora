import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as passwordGenerator from 'generate-password';
import { Repository } from 'typeorm';
import { ProjectAction } from '../domain/actions';
import {
  AddProjectClientRequest,
  UpdateProjectClientRequest,
  ProjectClientResponse,
  ListProjectClientsResponse,
  ProjectClientWithSecretResponse,
} from '../domain/http';
import { ProjectClient } from '../entity/project-client.entity';
import AuthorizationService from '../services/authorization.service';
import { ApiTags, ApiOperation, ApiResponse, ApiOAuth2 } from '@nestjs/swagger';

@Controller('api/v1/activities')
@UseGuards(AuthGuard())
@ApiOAuth2([])
@ApiTags('Activity Clients')
export default class ProjectClientController {
  constructor(
    private auth: AuthorizationService,
    @InjectRepository(ProjectClient) private projectClientRepo: Repository<ProjectClient>,
  ) {}

  @Get(':activityId/clients')
  @ApiOperation({ summary: `List an activity's clients` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ListProjectClientsResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async find(@Req() req, @Param('activityId') activityId: string) {
    const user = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    await this.auth.authorizeProjectAction(user, activityId, ProjectAction.ViewProjectClients);

    const clients = await this.projectClientRepo.find({
      where: { project: { id: activityId } },
    });

    return {
      data: clients.map(client => ({
        id: client.id,
        name: client.name,
        role: client.role,
      })),
    };
  }

  @Post(':activityId/clients')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: `Create a new activity client` })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ProjectClientWithSecretResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(@Req() req, @Param('activityId') activityId: string, @Body() addProjectClientRequest: AddProjectClientRequest) {
    const requestingUser = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    await this.auth.authorizeProjectAction(requestingUser, activityId, ProjectAction.AddProjectClient);

    const { secret, encryptedSecret } = await this.generateSecret();

    let client = this.projectClientRepo.create({
      project: { id: activityId },
      name: addProjectClientRequest.name,
      role: addProjectClientRequest.role,
      encryptedSecret: encryptedSecret,
    });

    client = await this.projectClientRepo.save(client, { reload: true });

    return {
      data: {
        id: client.id,
        name: client.name,
        role: client.role,
        secret: secret,
      },
    };
  }

  @Patch(':activityId/clients/:clientId')
  @ApiOperation({ summary: `Update an activity's client` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated', type: ProjectClientResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity or client not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async update(
    @Req() req,
    @Param('activityId') activityId: string,
    @Param('clientId') clientId: string,
    @Body() updateProjectClientRequest: UpdateProjectClientRequest,
  ) {
    const requestingUser = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    await this.auth.authorizeProjectAction(requestingUser, activityId, ProjectAction.EditProjectClients);

    const client = await this.projectClientRepo.findOneOrFail({
      where: { project: { id: activityId }, id: clientId },
    });

    client.role = updateProjectClientRequest.role;

    const updated = await this.projectClientRepo.save(client, { reload: true });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        role: updated.role,
      },
    };
  }

  @Post(':activityId/clients/:clientId/rotate-secret')
  @ApiOperation({ summary: `Rotate an activity's client secret key` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ProjectClientWithSecretResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity or client not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async rotate(@Req() req, @Param('activityId') activityId: string, @Param('clientId') clientId: string) {
    const requestingUser = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    await this.auth.authorizeProjectAction(requestingUser, activityId, ProjectAction.EditProjectClients);

    const client = await this.projectClientRepo.findOneOrFail({
      where: { project: { id: activityId }, id: clientId },
    });

    const { secret, encryptedSecret } = await this.generateSecret();

    client.encryptedSecret = encryptedSecret;

    const updated = await this.projectClientRepo.save(client, { reload: true });

    return {
      data: {
        id: updated.id,
        name: updated.name,
        role: updated.role,
        secret: secret,
      },
    };
  }

  @Delete(':activityId/clients/:clientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: `Revoke access from an activity's client` })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Activity or client not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async delete(@Req() req, @Param('activityId') activityId: string, @Param('clientId') clientId: string) {
    const requestingUser = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    await this.auth.authorizeProjectAction(requestingUser, activityId, ProjectAction.DeleteProjectClients);

    const client = await this.projectClientRepo.findOneOrFail({
      where: { project: { id: activityId }, id: clientId },
    });

    await this.projectClientRepo.remove(client);
  }

  private async generateSecret() {
    const secret = passwordGenerator.generate({
      length: 32,
      numbers: true,
      symbols: false,
      uppercase: true,
      strict: true,
    });
    const encryptedSecret = Buffer.from(await bcrypt.hash(secret, 10), 'utf-8');

    return {
      secret,
      encryptedSecret,
    };
  }
}
