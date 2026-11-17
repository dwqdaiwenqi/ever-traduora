import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'typeorm';
import { config } from '../src/config';
import { User } from '../src/entity/user.entity';
import { UserSeed } from '../src/seeds/user.seed';
import { UserService } from '../src/services/user.service';
import './util';
import { createAndMigrateApp } from './util';

describe('Default admin (e2e)', () => {
  let app: INestApplication;
  const originalAdminConfig = { ...config.defaultAdminCredentialConfig };

  beforeEach(async () => {
    app = await createAndMigrateApp();
  });

  afterEach(async () => {
    Object.assign(config.defaultAdminCredentialConfig, originalAdminConfig);
    await app.close();
  });

  const login = (username: string, password: string) =>
    request(app.getHttpServer()).post('/api/v1/auth/token').send({ grant_type: 'password', username, password });

  const seedAdmin = (adminPassword: string) => {
    Object.assign(config.defaultAdminCredentialConfig, { adminEmail: 'admin@test.com', adminPassword, adminName: 'Admin' });
    return app.get(UserSeed).createDefaultAdmin();
  };

  it('should default to the password 11111111 when TR_ADMIN_PASSWORD is not set', () => {
    // process.env.TR_ADMIN_PASSWORD is not set in the test environment
    expect(originalAdminConfig.adminPassword).toBe(process.env.TR_ADMIN_PASSWORD || '11111111');
  });

  it('should create the default admin with 12345678 and let it sign in with email + password', async () => {
    expect(await seedAdmin('12345678')).not.toBeNull();
    await login('admin@test.com', '12345678').expect(200);
    await login('admin@test.com', '87654321').expect(401);
  });

  it('should not create it twice', async () => {
    await seedAdmin('12345678');
    expect(await seedAdmin('12345678')).toBeNull();
    expect(await app.get(Connection).getRepository(User).countBy({ email: 'admin@test.com' })).toBe(1);
  });

  it('should turn a member that was added with this email earlier into the admin, instead of leaving it without a password', async () => {
    await app.get(UserService).findOrCreatePasswordless('admin@test.com');
    await request(app.getHttpServer()).post('/api/v1/auth/email-login').send({ email: 'admin@test.com' }).expect(200);

    await seedAdmin('12345678');

    // 之后必须用密码登录，不能再只凭邮箱
    await request(app.getHttpServer()).post('/api/v1/auth/email-login').send({ email: 'admin@test.com' }).expect(401);
    await login('admin@test.com', '12345678').expect(200);
  });

  it('should lock the admin for a while after too many wrong passwords', async () => {
    await seedAdmin('12345678');
    for (let i = 0; i < config.loginAttempts.maxAttempts; i++) {
      await login('admin@test.com', 'wrong-password').expect(401);
    }
    await login('admin@test.com', '12345678').expect(429);
  });
});
