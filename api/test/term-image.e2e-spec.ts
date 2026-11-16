import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import './util';
import { addTestProjectUser, createAndMigrateApp, createTestProject, signupTestUser, TestingProject, TestingUser } from './util';
import { ProjectRole } from '../src/entity/project-user.entity';

// 1x1 透明 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

describe('Term images (e2e)', () => {
  let app: INestApplication;
  let admin: TestingUser;
  let viewer: TestingUser;
  let project: TestingProject;
  let otherProject: TestingProject;

  const upload = (user: TestingUser, projectId: string, buf: Buffer, name = 'a.png', type = 'image/png') =>
    request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/term-images`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .attach('file', buf, { filename: name, contentType: type });

  beforeEach(async () => {
    app = await createAndMigrateApp();
    admin = await signupTestUser(app);
    viewer = await signupTestUser(app, 'viewer@test.com');
    project = await createTestProject(app, admin);
    otherProject = await createTestProject(app, admin);
    await addTestProjectUser(app, project, viewer, ProjectRole.Viewer);
  });

  afterEach(async () => {
    await app.close();
  });

  it('uploads a png and serves it back without login', async () => {
    const res = await upload(admin, project.id, PNG).expect(201);
    expect(res.body.data).toMatchObject({ mimeType: 'image/png', size: PNG.length });

    const got = await request(app.getHttpServer())
      .get(`/api/v1/projects/${project.id}/term-images/${res.body.data.id}`)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', c => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(got.headers['content-type']).toBe('image/png');
    expect(got.headers['x-content-type-options']).toBe('nosniff');
    expect(Buffer.compare(got.body, PNG)).toBe(0);
  });

  it('does not serve an image under another project', async () => {
    const res = await upload(admin, project.id, PNG).expect(201);
    await request(app.getHttpServer()).get(`/api/v1/projects/${otherProject.id}/term-images/${res.body.data.id}`).expect(404);
  });

  it('rejects non-images, svg and files that only claim to be images', async () => {
    await upload(admin, project.id, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'a.svg', 'image/svg+xml').expect(400);
    await upload(admin, project.id, Buffer.from('hello'), 'a.png', 'image/png').expect(400);
  });

  it('rejects images larger than 2MB', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024 + 1)]);
    await upload(admin, project.id, big).expect(413);
  });

  it('only users who can edit terms may upload', async () => {
    await upload(viewer, project.id, PNG).expect(404); // 无权限在项目里统一返回 404
  });
});
