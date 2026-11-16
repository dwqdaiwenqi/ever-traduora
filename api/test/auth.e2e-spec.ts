import { Connection } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import './util';
import { createAndMigrateApp, createTestProject, signupTestUser, TestingUser } from './util';
import { UserService } from '../src/services/user.service';

const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'mysupersecretpassword';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let testingUser: TestingUser;

  beforeEach(async () => {
    app = await createAndMigrateApp();
    // 管理员：唯一有密码的账号；其他成员（testingUser）没有密码，只凭邮箱登录
    await app.get(UserService).createWithPassword({ email: ADMIN_EMAIL, name: 'Admin', password: ADMIN_PASSWORD });
    testingUser = await signupTestUser(app);
  });

  it('/api/v1/auth/email-login (POST) should sign in an existing member with just the email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/email-login')
      .send({ email: testingUser.email.toUpperCase() })
      .expect(200)
      .expect(res => {
        expect(res.body.data.id).toEqual(testingUser.id);
        expect(res.body.data.accessToken).toBeTruthy();
      });
  });

  it('/api/v1/auth/email-login (POST) should reject an email nobody added, without creating an account', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/email-login')
      .send({ email: 'stranger@test.com' })
      .expect(401)
      .expect(res => expect(res.body.error.code).toBe('EmailNotRegistered'));
    expect(await app.get(UserService).userExists('stranger@test.com')).toBe(false);
  });

  it('/api/v1/auth/email-login (POST) should not let anyone sign in as the admin with just its email', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/email-login')
      .send({ email: ADMIN_EMAIL })
      .expect(401)
      .expect(res => {
        expect(res.body.error.code).toBe('PasswordRequired');
        expect(res.body.data).toBeUndefined();
      });
  });

  it('/api/v1/auth/email-login (POST) should reject a malformed request', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/email-login').send({}).expect(400);
    await request(app.getHttpServer()).post('/api/v1/auth/email-login').send({ email: 'not-an-email' }).expect(400);
  });

  it('/api/v1/auth/token (POST) should not let a member without a password use the password grant', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({ grant_type: 'password', username: testingUser.email, password: 'whatever-password' })
      .expect(422);
  });

  it('should no longer expose signup, password reset or password change', async () => {
    for (const path of ['signup', 'forgot-password', 'reset-password', 'change-password', 'verify-email']) {
      await request(app.getHttpServer()).post(`/api/v1/auth/${path}`).send({}).expect(404);
    }
    await request(app.getHttpServer()).get('/api/v1/auth/providers').expect(404);
  });

  it('/api/v1/auth/token (POST) should grant token to user with valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'password',
        username: ADMIN_EMAIL,
        password: 'mysupersecretpassword',
      })
      .expect(200)
      .expect(res => expect(res.body).toHaveExactProperties(['access_token', 'expires_in', 'token_type']));
  });

  it('/api/v1/auth/token (POST) should not grant a token to user with missing credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'password',
        username: ADMIN_EMAIL,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'password',
        password: 'mysupersecretpassword',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'password',
        username: '',
        password: 'mysupersecretpassword',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'password',
        username: ADMIN_EMAIL,
        password: '',
      })
      .expect(400);
  });

  it('/api/v1/auth/token (POST) should grant token to client with valid credentials', async () => {
    const testProject = await createTestProject(app, testingUser);

    let clientId: string;
    let clientSecret: string;

    await request(app.getHttpServer())
      .post(`/api/v1/activities/${testProject.id}/clients`)
      .set('Authorization', `Bearer ${testingUser.accessToken}`)
      .send({
        name: 'My project client',
        role: 'viewer',
      })
      .expect(201)
      .expect(res => {
        expect(res.body.data).toHaveExactProperties(['id', 'name', 'role', 'secret']);
        clientId = res.body.data.id;
        clientSecret = res.body.data.secret;
      });

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      })
      .expect(200)
      .expect(res => expect(res.body).toHaveExactProperties(['access_token', 'expires_in', 'token_type']));

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret + 'bla',
      })
      .expect(401)
      .expect(res => expect(res.body.data).toBeUndefined());
  });

  it('/api/v1/auth/token (POST) should not grant a token to client with missing credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'client_credentials',
        username: ADMIN_EMAIL,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'client_credentials',
        password: 'mysupersecretpassword',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'client_credentials',
        username: '',
        password: 'mysupersecretpassword',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'client_credentials',
        username: ADMIN_EMAIL,
        password: '',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'client_credentials',
        username: ADMIN_EMAIL,
        password: 'mysupersecretpassword',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        username: ADMIN_EMAIL,
        password: 'mysupersecretpassword',
      })
      .expect(400)
      .expect(res => expect(res.body.data).toBeUndefined());
  });

  it('/api/v1/auth/token (POST) should not grant token to user with invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'password',
        username: ADMIN_EMAIL,
        password: 'mynotsupersecretpassword',
      })
      .expect(401)
      .expect(res => expect(res.body.data).toBeUndefined());

    await request(app.getHttpServer())
      .post('/api/v1/auth/token')
      .send({
        grant_type: 'client_credentials',
        username: ADMIN_EMAIL,
        password: 'mysupersecretpassword',
      })
      .expect(400)
      .expect(res => expect(res.body.data).toBeUndefined());
  });

  it('should reject a token signed with the former default secret', async () => {
    const forgedToken = new JwtService({ secret: 'secret' }).sign({ sub: testingUser.id, type: 'user' });

    await request(app.getHttpServer()).get('/api/v1/users/me').set('Authorization', `Bearer ${forgedToken}`).expect(401);
    await request(app.getHttpServer()).get('/api/v1/users/me').set('Authorization', `Bearer ${testingUser.accessToken}`).expect(200);
  });

  afterEach(async () => {
    await app.get(Connection).close();
    await app.close();
  });
});
