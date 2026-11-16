import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'typeorm';
import './util';
import { addTestProjectUser, createAndMigrateApp, createTestProject, signupTestUser, TestingProject, TestingUser } from './util';
import { ProjectRole } from '../src/entity/project-user.entity';
import { TranslationVersion } from '../src/entity/translation-version.entity';

describe('Translation confirmation (e2e)', () => {
  let app: INestApplication;
  let admin: TestingUser;
  let editor: TestingUser;
  let project: TestingProject;
  let termId: string;

  const api = (method: 'get' | 'post' | 'patch', path: string, user?: TestingUser) => {
    const r = request(app.getHttpServer())[method](`/api/v1${path}`);
    return user ? r.set('Authorization', `Bearer ${user.accessToken}`) : r;
  };

  beforeEach(async () => {
    app = await createAndMigrateApp();
    admin = await signupTestUser(app);
    editor = await signupTestUser(app, 'editor@test.com');
    project = await createTestProject(app, admin);
    await addTestProjectUser(app, project, editor, ProjectRole.Editor);
    termId = (await api('post', `/projects/${project.id}/terms`, admin).send({ value: 'term.one' })).body.data.id;
    await api('post', `/projects/${project.id}/translations`, admin).send({ code: 'ja_JP' }).expect(201);
  });

  afterEach(async () => {
    await app.close();
  });

  it('editor translation is pending until an admin confirms it; the public api only serves confirmed values', async () => {
    await api('patch', `/projects/${project.id}/translations/ja_JP`, editor).send({ termId, value: 'こんにちは' }).expect(200);

    // 公开接口：还没确认，拿不到
    await api('get', `/i18n/${project.id}/ja_JP`).expect(200).expect({});

    // 待确认数量
    const list = await api('get', `/projects/${project.id}/translations`, editor).expect(200);
    expect(list.body.data[0].pendingCount).toBe(1);

    // editor 不能确认（项目里 403 统一返回 404）
    await api('post', `/projects/${project.id}/translations/ja_JP/confirm`, editor)
      .send({ items: [{ termId, value: 'こんにちは' }] })
      .expect(404);

    // admin 确认
    const res = await api('post', `/projects/${project.id}/translations/ja_JP/confirm`, admin)
      .send({ items: [{ termId, value: 'こんにちは' }] })
      .expect(200);
    expect(res.body.data).toEqual({ confirmed: 1, skipped: 0, version: 1 });

    const served = await api('get', `/i18n/${project.id}/ja_JP`).expect(200);
    expect(served.body).toEqual({ 'term.one': 'こんにちは' });

    // 304 / ETag
    await api('get', `/i18n/${project.id}/ja_JP`).set('If-None-Match', served.headers.etag).expect(304);

    // 留存了一份副本
    const versions = await app.get(Connection).getRepository(TranslationVersion).find();
    expect(versions).toHaveLength(1);
    expect(JSON.parse(versions[0].content)).toEqual({ 'term.one': 'こんにちは' });
    expect(JSON.parse(versions[0].changedKeys)).toEqual(['term.one']);
  });

  it('keeps serving the old value while a new edit is pending, and a stale confirm is skipped', async () => {
    await api('patch', `/projects/${project.id}/translations/ja_JP`, editor).send({ termId, value: 'v1' });
    await api('post', `/projects/${project.id}/translations/ja_JP/confirm`, admin).send({ items: [{ termId, value: 'v1' }] }).expect(200);

    await api('patch', `/projects/${project.id}/translations/ja_JP`, editor).send({ termId, value: 'v2' });
    await api('get', `/i18n/${project.id}/ja_JP`).expect(200).expect({ 'term.one': 'v1' });

    // 开发看到的是 v2，但确认前运营又改成了 v3 → 跳过，v3 仍待确认
    await api('patch', `/projects/${project.id}/translations/ja_JP`, editor).send({ termId, value: 'v3' });
    const stale = await api('post', `/projects/${project.id}/translations/ja_JP/confirm`, admin)
      .send({ items: [{ termId, value: 'v2' }] })
      .expect(200);
    expect(stale.body.data).toEqual({ confirmed: 0, skipped: 1, version: null });
    await api('get', `/i18n/${project.id}/ja_JP`).expect(200).expect({ 'term.one': 'v1' });

    await api('post', `/projects/${project.id}/translations/ja_JP/confirm`, admin).send({ items: [{ termId, value: 'v3' }] }).expect(200);
    await api('get', `/i18n/${project.id}/ja_JP`).expect(200).expect({ 'term.one': 'v3' });
  });

  it('an admin edit takes effect immediately', async () => {
    await api('patch', `/projects/${project.id}/translations/ja_JP`, admin).send({ termId, value: 'admin value' }).expect(200);
    await api('get', `/i18n/${project.id}/ja_JP`).expect(200).expect({ 'term.one': 'admin value' });
    const list = await api('get', `/projects/${project.id}/translations`, admin).expect(200);
    expect(list.body.data[0].pendingCount).toBe(0);
  });

  it('an editor changing the value back to the effective one leaves nothing pending', async () => {
    await api('patch', `/projects/${project.id}/translations/ja_JP`, admin).send({ termId, value: 'same' });
    await api('patch', `/projects/${project.id}/translations/ja_JP`, editor).send({ termId, value: 'changed' });
    await api('patch', `/projects/${project.id}/translations/ja_JP`, editor).send({ termId, value: 'same' });
    const list = await api('get', `/projects/${project.id}/translations`, admin).expect(200);
    expect(list.body.data[0].pendingCount).toBe(0);
  });

  it('public api 404s for unknown project or locale', async () => {
    await api('get', `/i18n/${project.id}/fr`).expect(404);
    await api('get', `/i18n/00000000-0000-0000-0000-000000000000/ja_JP`).expect(404);
  });
});
