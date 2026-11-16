import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectAction } from '../domain/actions';
import { AddProjectUserRequest, ListProjectUsersResponse, ProjectUserResponse, UpdateProjectUserRequest } from '../domain/http';
import { ProjectUser } from '../entity/project-user.entity';
import AuthorizationService from '../services/authorization.service';
import { UserService } from '../services/user.service';

@Controller('api/v1/projects')
@UseGuards(AuthGuard())
@ApiOAuth2([])
@ApiTags('Project Users')
export default class ProjectUserController {
  constructor(
    private auth: AuthorizationService,
    @InjectRepository(ProjectUser) private projectUserRepo: Repository<ProjectUser>,
    private userService: UserService,
  ) {}

  @Get(':projectId/users')
  @ApiOperation({ summary: 'List all users with access to a project' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ListProjectUsersResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async find(@Req() req, @Param('projectId') projectId: string) {
    const user = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    await this.auth.authorizeProjectAction(user, projectId, ProjectAction.ViewProjectUsers);

    const users = await this.projectUserRepo.find({
      where: { project: { id: projectId } },
      relations: ['user'],
    });

    return {
      data: users.map(member => ({
        userId: member.user.id,
        role: member.role,
        name: member.user.name,
        email: member.user.email,
      })),
    };
  }

  @Post(':projectId/users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to a project by email; an account without a password is created if the email is new' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ProjectUserResponse })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'The user is already part of the project' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async create(@Req() req, @Param('projectId') projectId: string, @Body() addProjectUserRequest: AddProjectUserRequest) {
    const requestingUser = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    await this.auth.authorizeProjectAction(requestingUser, projectId, ProjectAction.EditProjectUsers);

    // 新邮箱会自动建一个没有密码的账号，成员之后只凭邮箱登录
    const targetUser = await this.userService.findOrCreatePasswordless(addProjectUserRequest.email);

    const existing = await this.projectUserRepo.findOne({ where: { project: { id: projectId }, user: { id: targetUser.id } } });
    if (existing) {
      throw new ConflictException('this user is already part of the project');
    }

    const created = await this.projectUserRepo.save(
      this.projectUserRepo.create({ project: { id: projectId }, user: targetUser, role: addProjectUserRequest.role }),
    );

    return {
      data: {
        userId: targetUser.id,
        role: created.role,
        name: targetUser.name,
        email: targetUser.email,
      },
    };
  }

  @Patch(':projectId/users/:userId')
  @ApiOperation({ summary: `Update a project user's role` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated', type: ProjectUserResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request params or attempting to edit own role' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async update(
    @Req() req,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Body() updateProjectUserRequest: UpdateProjectUserRequest,
  ) {
    const requestingUser = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    await this.auth.authorizeProjectAction(requestingUser, projectId, ProjectAction.EditProjectUsers);

    // Prevent the current user from editing himself
    if (requestingUser.id === userId) {
      throw new BadRequestException(`can't edit your own role`);
    }

    const targetUser = await this.projectUserRepo.findOneOrFail({
      where: { user: { id: userId }, project: { id: projectId } },
      relations: ['user', 'project'],
    });

    targetUser.role = updateProjectUserRequest.role;

    const updated = await this.projectUserRepo.save(targetUser, { reload: true });

    return {
      data: {
        userId: updated.user.id,
        role: updated.role,
        name: updated.user.name,
        email: updated.user.email,
      },
    };
  }

  @Delete(':projectId/users/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: `Revoke a user's access to a project` })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: `Bad request, can't edit your own role` })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async delete(@Req() req, @Param('projectId') projectId: string, @Param('userId') userId: string) {
    const requestingUser = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    await this.auth.authorizeProjectAction(requestingUser, projectId, ProjectAction.DeleteProjectUsers);

    // Prevent the current user from removing himself
    if (requestingUser.id === userId) {
      throw new BadRequestException(`can't edit your own role`);
    }

    const targetUser = await this.projectUserRepo.findOne({
      where: {
        user: { id: userId },
        project: { id: projectId },
      },
      relations: ['user', 'project'],
    });

    if (!targetUser) {
      throw new BadRequestException(`The specified user is not part of this project.`);
    }

    await this.projectUserRepo.remove(targetUser);
  }
}
