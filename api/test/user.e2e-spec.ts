import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import './util';
import { createAndMigrateApp, signupTestUser, TestingUser } from './util';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let testingUser: TestingUser;

  beforeEach(async () => {
    app = await createAndMigrateApp();
    testingUser = await signupTestUser(app);
  });

  afterEach(async () => {
    await app.close();
  });

  const me = () => request(app.getHttpServer()).get('/api/v1/users/me').set('Authorization', `Bearer ${testingUser.accessToken}`);

  it('/api/v1/users/me (GET) should return requesting user info', async () => {
    await me()
      .expect(200)
      .expect(res => expect(res.body.data).toMatchObject({ id: testingUser.id, email: testingUser.email }));
  });

  it('/api/v1/users/me (PATCH) should update the name, but not the email', async () => {
    // 邮箱不能自己改：带上 email 字段也只会更新名字
    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${testingUser.accessToken}`)
      .send({ name: 'Updated Name ⛄ 😀👍 🍉你好', email: 'someone-else@test.com' })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${testingUser.accessToken}`)
      .send({ name: 'Updated Name ⛄ 😀👍 🍉你好' })
      .expect(200)
      .expect(res => expect(res.body.data).toMatchObject({ name: 'Updated Name ⛄ 😀👍 🍉你好', email: testingUser.email }));
    await me().expect(res => expect(res.body.data.email).toEqual(testingUser.email));
  });

  it('/api/v1/users/me (PATCH) should reject a malformed name', async () => {
    for (const name of ['', 'a', '   ', 'x'.repeat(256)]) {
      await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${testingUser.accessToken}`)
        .send({ name })
        .expect(400);
    }
  });

  it('/api/v1/users/me should not be reachable without a token, and accounts can not be self-deleted', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    await request(app.getHttpServer()).delete('/api/v1/users/me').set('Authorization', `Bearer ${testingUser.accessToken}`).expect(404);
  });
});
