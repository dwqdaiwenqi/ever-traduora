import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Throttle } from '@nestjs/throttler';
import { config } from '../config';
import { AccessTokenDTO, AuthenticateRequest, EmailLoginRequest, GrantType, JwtPayload } from '../domain/http';
import { ProjectClient } from '../entity/project-client.entity';
import { User } from '../entity/user.entity';
import { UserService } from '../services/user.service';

const authThrottle = {
  default: {
    limit: config.throttle.auth.limit,
    ttl: config.throttle.auth.ttl,
  },
};

/**
 * 登录只有两种方式（内部系统，刻意从简）：
 *  - 管理员：邮箱 + 密码（POST /auth/token，grant_type=password）
 *  - 其他成员：只要邮箱（POST /auth/email-login），前提是管理员已经把这个邮箱加进了某个项目
 * 另外 API 客户端用 client_credentials 换 token。没有注册、改密码、邮箱验证。
 */
@Controller('api/v1/auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(ProjectClient) private projectClientRepo: Repository<ProjectClient>,
  ) {}

  private signUserToken(user: User): string {
    const tokenPayload: JwtPayload = { sub: user.id, type: 'user', sv: user.sessionVersion ?? 0 };
    return this.jwtService.sign(tokenPayload);
  }

  @Throttle(authThrottle)
  @Post('email-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in with just an email',
    description: 'Only for accounts without a password, i.e. members added to an activity by an admin. The admin account must use a password.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Signed in' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'EmailNotRegistered, or PasswordRequired for the admin account' })
  async emailLogin(@Body() payload: EmailLoginRequest) {
    const user = await this.userService.loginByEmail(payload.email);
    return { data: { id: user.id, email: user.email, name: user.name, accessToken: this.signUserToken(user) } };
  }

  @Throttle(authThrottle)
  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request an authentication token for the admin user or an activity client',
    description:
      'The grant type must be one of **password** or **client_credentials**. ' +
      'When using a grant type of *password*, you must provide the fields *username* (email) and *password*. ' +
      'When using the grant type *client_credentials* you must provide the fields *client_id* and *client_secret*.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully authenticated', type: AccessTokenDTO })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many attempts, please wait at least 15 minutes before retrying' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Bad credentials' })
  async token(@Body() payload: AuthenticateRequest) {
    let token: string;
    switch (payload.grant_type) {
      case GrantType.Password: {
        if (!payload.username || !payload.password) {
          throw new BadRequestException('missing credentials');
        }
        const user = await this.userService.authenticate({ email: payload.username, password: payload.password });
        token = this.signUserToken(user);
        break;
      }
      case GrantType.ClientCredentials: {
        if (!payload.client_id || !payload.client_secret) {
          throw new BadRequestException('missing credentials');
        }
        token = await this.authenticateClient(payload.client_id, payload.client_secret);
        break;
      }
      default:
        throw new BadRequestException('invalid grant type');
    }
    return { access_token: token, token_type: 'bearer', expires_in: `${config.authTokenExpires}s` };
  }

  private async authenticateClient(clientId: string, password: string) {
    const client = await this.projectClientRepo.findOneOrFail({ where: { id: clientId } });
    const valid = await bcrypt.compare(password, client.encryptedSecret.toString('utf8'));
    if (!valid) {
      throw new UnauthorizedException('invalid credentials');
    }
    const tokenPayload: JwtPayload = { sub: client.id, type: 'client' };
    return this.jwtService.sign(tokenPayload);
  }
}
