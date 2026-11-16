import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { Connection } from 'typeorm';
import { addPipesAndFilters, AppModule } from '../src/app.module';
import { ProjectRole, ProjectUser } from '../src/entity/project-user.entity';
import { UserService } from '../src/services/user.service';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';

export interface TestingUser {
  id: string;
  name: string;
  email: string;
  accessToken: string;
}

export interface TestingProject {
  id: string;
  name: string;
  description: string;
  role: string;
}

export interface TestingProjectClient {
  id: string;
  name: string;
  role: string;
  accessToken: string;
}

/**
 * 创建一个没有密码的成员账号（和"管理员在项目里添加成员"得到的账号一样），并通过邮箱登录拿到 token。
 */
export async function signupTestUser(app: INestApplication, email: string = 'e2e@test.com'): Promise<TestingUser> {
  await app.get(UserService).findOrCreatePasswordless(email);
  const res = await request(app.getHttpServer()).post('/api/v1/auth/email-login').send({ email }).expect(200);
  const result = res.body.data as TestingUser;
  if (!result.id || !result.name || !result.email || !result.accessToken) {
    throw new Error('Malformed email login response! Maybe fields need updating?');
  }
  return { ...result, name: result.name };
}

export async function createTestProject(app: INestApplication, user: TestingUser): Promise<TestingProject> {
  const res = await request(app.getHttpServer()).post('/api/v1/projects').set('Authorization', `Bearer ${user.accessToken}`).send({
    name: 'My test project',
  });
  const result = res.body.data as TestingProject;
  if (!result.id || !result.name || !result.role) {
    throw new Error('Malformed create project response! Maybe fields need updating?');
  }
  return result;
}

/**
 * Adds a user to a project with the given role, straight in the database: there is no invite endpoint any more.
 */
export async function addTestProjectUser(
  app: INestApplication,
  project: TestingProject,
  user: TestingUser,
  role: ProjectRole | string,
): Promise<void> {
  const repo = app.get(Connection).getRepository(ProjectUser);
  await repo.save(repo.create({ project: { id: project.id }, user: { id: user.id }, role: role as ProjectRole }));
}

export async function createTestProjectClient(
  app: INestApplication,
  user: TestingUser,
  project: TestingProject,
  role: ProjectRole = ProjectRole.Viewer,
): Promise<TestingProjectClient> {
  const result = {
    id: '',
    name: '',
    role: '',
    accessToken: '',
  };

  let secret: string;

  await request(app.getHttpServer())
    .post(`/api/v1/projects/${project.id}/clients`)
    .set('Authorization', `Bearer ${user.accessToken}`)
    .send({
      name: 'My project client',
      role: role,
    })
    .expect(201)
    .expect(res => {
      expect(res.body.data).toHaveExactProperties(['id', 'name', 'role', 'secret']);
      result.id = res.body.data.id;
      result.name = res.body.data.name;
      result.role = res.body.data.role;
      secret = res.body.data.secret;
    });

  await request(app.getHttpServer())
    .post('/api/v1/auth/token')
    .send({
      grant_type: 'client_credentials',
      client_id: result.id,
      client_secret: secret,
    })
    .expect(200)
    .expect(res => {
      expect(res.body).toHaveExactProperties(['access_token', 'expires_in', 'token_type']);
      result.accessToken = res.body.access_token;
    });

  return result;
}

/**
 * Creates and initializes a Nest application, drops the database, runs migrations, and returns the initialized application.
 * @returns The initialized Nest application.
 */
export async function createAndMigrateApp(): Promise<INestApplication> {
  // Compile the testing module for the AppModule
  const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();

  // Create a Nest application instance using the ExpressAdapter
  const app = moduleFixture.createNestApplication<NestExpressApplication>(new ExpressAdapter());

  // Apply any middleware, pipes, and filters to the application
  addPipesAndFilters(app);

  // Initialize the application
  await app.init();

  // Get the database connection from the application
  const connection = app.get(Connection);

  // dropDatabase wipes everything: never let it hit a non-e2e database (e.g. tr_dev)
  const dbName = String(connection.options.database || '');
  if (!dbName.includes('e2e')) {
    throw new Error(`Refusing to drop database "${dbName}": e2e tests must use a database whose name contains "e2e"`);
  }

  try {
    // Drop the database
    await connection.dropDatabase();

    // Run migrations
    await connection.runMigrations();
  } catch (error) {
    // Handle errors if dropping the database or running migrations fails
    console.error('Error occurred while dropping database or running migrations:', error);
  }

  // Return the initialized application
  return app;
}

expect.extend({
  toHaveExactProperties(received: any, expectedProps: string[]) {
    if (!(received !== null && typeof received === 'object')) {
      return {
        message: () => `'${received}' must of type object`,
        pass: false,
      };
    }

    let remaining = expectedProps;
    for (const key of Object.keys(received)) {
      if (!expectedProps.find(k => k === key)) {
        return {
          message: () => `received object contains unexpected property '${key}'`,
          pass: false,
        };
      }
      remaining = remaining.filter(prop => prop !== key);
    }
    if (remaining.length > 0) {
      return {
        message: () => `'${Object.keys(received)}' does not contain properties '${remaining}'`,
        pass: false,
      };
    }
    return {
      message: () => '',
      pass: true,
    };
  },
});
