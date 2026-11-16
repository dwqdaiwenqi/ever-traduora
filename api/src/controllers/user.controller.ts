import { Body, Controller, Get, HttpStatus, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserDataRequest, UserInfoResponse } from '../domain/http';
import AuthorizationService from '../services/authorization.service';
import { UserService } from '../services/user.service';

@Controller('api/v1/users')
@UseGuards(AuthGuard())
@ApiOAuth2([])
@ApiTags('Users')
export default class UserController {
  constructor(
    private auth: AuthorizationService,
    private userService: UserService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: `Get the current user's profile` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: UserInfoResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async me(@Req() req) {
    const user = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    return { data: user };
  }

  @Patch('me')
  @ApiOperation({ summary: `Update the current user's name` })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated', type: UserInfoResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async update(@Req() req, @Body() payload: UpdateUserDataRequest) {
    const user = this.auth.getRequestUserOrClient(req, { mustBeUser: true });
    const updated = payload.name ? await this.userService.updateName(user.id, payload.name) : user;
    return { data: { id: updated.id, name: updated.name, email: updated.email, emailVerified: updated.emailVerified } };
  }
}
