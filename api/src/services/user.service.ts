import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { IsNull, Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { CodedException, TooManyRequestsException } from '../errors';
import { UserLoginAttemptsStorage } from '../redis/user-login-attempts.storage';
import { config } from '../config';

/**
 * 账号模型（内部系统，刻意从简）：
 *  - 只有一个管理员账号有密码（由 TR_ADMIN_EMAIL / TR_ADMIN_PASSWORD 创建），用邮箱 + 密码登录。
 *  - 其他成员没有密码，由管理员在项目里按邮箱添加，之后只凭邮箱登录。
 *  - 没有注册、没有改密码、没有邮箱验证。
 */
@Injectable()
export class UserService {
  private readonly loginAttemptsTTL: number;
  private readonly maxLoginAttempts: number;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly loginAttemptsStorage: UserLoginAttemptsStorage,
  ) {
    this.loginAttemptsTTL = config.loginAttempts.ttl;
    this.maxLoginAttempts = config.loginAttempts.maxAttempts;
  }

  /**
   * 邮箱不区分大小写：管理员添加成员时写的和成员登录时输入的大小写不一样，不应该登录失败。
   * （旧数据里邮箱前半部分可能带大写，所以用 LOWER 比较，而不是只改写入的值。）
   */
  private findByEmail(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .where('LOWER(user.email) = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }

  async userExists(email: string): Promise<boolean> {
    return (await this.findByEmail(email)) != null;
  }

  /** 管理员添加成员时调用：这个邮箱还没有账号就建一个没有密码的，已经有就直接返回。 */
  async findOrCreatePasswordless(email: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);
    if (existing) {
      return existing;
    }
    const user = new User();
    user.email = normalizedEmail;
    user.name = normalizedEmail.split('@')[0];
    user.emailVerified = true;
    return this.userRepo.save(user);
  }

  async createWithPassword({ email, name, password }: { email: string; name: string; password: string }): Promise<User> {
    const user = new User();
    user.email = email.trim().toLowerCase();
    user.name = name;
    user.emailVerified = true;
    user.encryptedPassword = Buffer.from(await bcrypt.hash(password, 10), 'utf-8');
    return this.userRepo.save(user);
  }

  /** 账号存在但还没有密码时设置密码（比如管理员邮箱之前被当成普通成员加过）。返回是否设置了。 */
  async setMissingPassword(email: string, password: string): Promise<boolean> {
    const encryptedPassword = Buffer.from(await bcrypt.hash(password, 10), 'utf-8');
    const user = await this.findByEmail(email);
    if (!user) {
      return false;
    }
    const { affected } = await this.userRepo.update({ id: user.id, encryptedPassword: IsNull() }, { encryptedPassword });
    return !!affected;
  }

  async updateName(userId: string, name: string): Promise<User> {
    await this.userRepo.update({ id: userId }, { name });
    return this.userRepo.findOneByOrFail({ id: userId });
  }

  /**
   * 邮箱登录：只允许已经被管理员加进来、并且没有密码的账号。
   * 有密码的账号（管理员）必须走密码登录，否则知道管理员邮箱的人就能直接登录。
   */
  async loginByEmail(email: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new CodedException(HttpStatus.UNAUTHORIZED, 'EmailNotRegistered', '这个邮箱还没有被添加，请联系管理员');
    }
    if (user.encryptedPassword) {
      throw new CodedException(HttpStatus.UNAUTHORIZED, 'PasswordRequired', '该账号需要使用密码登录');
    }
    return user;
  }

  /** 管理员密码登录。连续输错会被锁定一段时间，防止暴力破解。 */
  async authenticate({ email, password }: { email: string; password: string }): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }

    const userKey = `user-${user.id}`;
    const timeThreshold = moment().subtract(15, 'minutes').toDate();

    let loginAttempts = await this.getLoginAttempts(userKey, user);
    // Reset login attempts if the last failed attempt is older than 15 minutes
    if (user.lastLogin < timeThreshold) {
      loginAttempts = 0;
    }
    if (loginAttempts >= this.maxLoginAttempts) {
      await this.incrementLoginAttempts(user, loginAttempts, userKey);
      throw new TooManyRequestsException('You have made too many requests. Please try again later.');
    }

    if (!user.encryptedPassword) {
      await this.incrementLoginAttempts(user, loginAttempts, userKey);
      throw new UnprocessableEntityException('这个账号没有密码，请直接用邮箱登录');
    }
    if (!(await bcrypt.compare(password, user.encryptedPassword.toString('utf8')))) {
      await this.incrementLoginAttempts(user, loginAttempts, userKey);
      throw new UnauthorizedException('invalid credentials');
    }

    await this.resetLoginAttempts(userKey, user);
    return user;
  }

  private async getLoginAttempts(userKey: string, user: User): Promise<number> {
    if (this.loginAttemptsStorage.getRedisClient()) {
      return await this.loginAttemptsStorage.getUserAttempts(userKey);
    }
    return user.loginAttempts;
  }

  private async incrementLoginAttempts(user: User, loginAttempts: number, userKey: string): Promise<void> {
    user.lastLogin = new Date();
    await this.userRepo.update({ id: user.id }, { lastLogin: user.lastLogin });

    if (this.loginAttemptsStorage.getRedisClient()) {
      await this.loginAttemptsStorage.setUserAttempts(userKey, loginAttempts + 1, this.loginAttemptsTTL);
    }
    await this.userRepo.increment({ id: user.id }, 'loginAttempts', 1);
  }

  private async resetLoginAttempts(userKey: string, user: User): Promise<void> {
    if (this.loginAttemptsStorage.getRedisClient()) {
      await this.loginAttemptsStorage.setUserAttempts(userKey, 0, this.loginAttemptsTTL);
    }
    user.loginAttempts = 0;
    await this.userRepo.update({ id: user.id }, { loginAttempts: 0 });
  }
}
