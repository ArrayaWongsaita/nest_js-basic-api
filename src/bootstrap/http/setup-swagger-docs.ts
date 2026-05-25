import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppConfig } from '../config/app-config';
import { IamModule } from '../../contexts/iam/iam.module';
import { TodoModule } from '../../contexts/todo/todo.module';
import { NoteModule } from '../../contexts/note/note.module';
import { ContactModule } from '../../contexts/contact/contact.module';
import { BookModule } from '../../contexts/book/book.module';
import { MovieModule } from '../../contexts/movie/movie.module';
import { ExpenseModule } from '../../contexts/expense/expense.module';
import { createSwaggerBasicAuthMiddleware } from './swagger-basic-auth.middleware';

type SwaggerDocumentDefinition = {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly modules: SwaggerDocumentOptions['include'];
  readonly allowedPaths?: readonly string[];
};

const swaggerDocuments: readonly SwaggerDocumentDefinition[] = [
  {
    title: 'IAM API',
    description: 'Identity and access management HTTP API.',
    path: 'docs/iam',
    modules: [IamModule],
    allowedPaths: [
      '/auth/login',
      '/auth/refresh',
      '/auth/logout',
      '/auth/me',
    ],
  },
  {
    title: 'Admin API',
    description:
      'System administration API for IAM management, RBAC catalog management, and demo-data resets.',
    path: 'docs/admin',
    modules: [IamModule],
    allowedPaths: [
      '/admin/users',
      '/admin/users/{userId}',
      '/admin/users/{userId}/roles',
      '/admin/users/{userId}/status',
      '/admin/roles',
      '/admin/roles/{roleId}',
      '/admin/permissions',
      '/admin/permissions/{permissionId}',
      '/admin/data-resets',
    ],
  },
  {
    title: 'Todo API',
    description:
      'Todo HTTP API with authenticated routes, user-id demo routes, and login helpers.',
    path: 'docs/todo',
    modules: [TodoModule, IamModule],
    allowedPaths: [
      '/auth/login',
      '/auth/me',
      '/todos',
      '/todos/{todoId}',
      '/users/{userId}/todos',
      '/users/{userId}/todos/{todoId}',
    ],
  },
  {
    title: 'Note API',
    description:
      'Note HTTP API with authenticated routes, user-id demo routes, and login helpers.',
    path: 'docs/notes',
    modules: [NoteModule, IamModule],
    allowedPaths: [
      '/auth/login',
      '/auth/me',
      '/notes',
      '/notes/{noteId}',
      '/users/{userId}/notes',
      '/users/{userId}/notes/{noteId}',
    ],
  },
  {
    title: 'Contact API',
    description:
      'Contact HTTP API with authenticated routes, user-id demo routes, and login helpers.',
    path: 'docs/contacts',
    modules: [ContactModule, IamModule],
    allowedPaths: [
      '/auth/login',
      '/auth/me',
      '/contacts',
      '/contacts/{contactId}',
      '/users/{userId}/contacts',
      '/users/{userId}/contacts/{contactId}',
    ],
  },
  {
    title: 'Book Library API',
    description:
      'Book Library HTTP API with authenticated routes, user-id demo routes, and login helpers.',
    path: 'docs/books',
    modules: [BookModule, IamModule],
    allowedPaths: [
      '/auth/login',
      '/auth/me',
      '/books',
      '/books/{bookId}',
      '/users/{userId}/books',
      '/users/{userId}/books/{bookId}',
    ],
  },
  {
    title: 'Movie Watchlist API',
    description:
      'Movie Watchlist HTTP API with authenticated routes, user-id demo routes, and login helpers.',
    path: 'docs/movies',
    modules: [MovieModule, IamModule],
    allowedPaths: [
      '/auth/login',
      '/auth/me',
      '/movies',
      '/movies/{movieId}',
      '/users/{userId}/movies',
      '/users/{userId}/movies/{movieId}',
    ],
  },
  {
    title: 'Expense Tracker API',
    description:
      'Expense Tracker HTTP API with authenticated routes, user-id demo routes, and login helpers.',
    path: 'docs/expenses',
    modules: [ExpenseModule, IamModule],
    allowedPaths: [
      '/auth/login',
      '/auth/me',
      '/transactions',
      '/transactions/{expenseId}',
      '/users/{userId}/transactions',
      '/users/{userId}/transactions/{expenseId}',
    ],
  },
];

export function setupSwaggerDocs(
  app: INestApplication,
  appConfig: AppConfig,
): void {
  if (!appConfig.swagger.enabled) {
    return;
  }

  const username = appConfig.swagger.username;
  const password = appConfig.swagger.password;

  if (!username || !password) {
    throw new Error(
      'Swagger credentials must be configured before setting up documentation.',
    );
  }

  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.use(
    '/docs',
    createSwaggerBasicAuthMiddleware({ username, password }),
  );

  for (const swaggerDocument of swaggerDocuments) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle(swaggerDocument.title)
        .setDescription(swaggerDocument.description)
        .setVersion('1.0.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description:
              'Bearer access token returned by the IAM auth endpoints.',
          },
          'access-token',
        )
        .addCookieAuth(
          appConfig.auth.refreshCookieName,
          {
            type: 'apiKey',
            in: 'cookie',
            description:
              'HttpOnly refresh-token cookie used by /auth/refresh and /auth/logout.',
          },
          'refresh-token',
        )
        .build(),
      {
        include: swaggerDocument.modules,
      },
    );

    SwaggerModule.setup(swaggerDocument.path, app, cleanupOpenApiDoc(
      filterDocumentPaths(document, swaggerDocument.allowedPaths),
    ), {
      jsonDocumentUrl: `${swaggerDocument.path}-json`,
      yamlDocumentUrl: `${swaggerDocument.path}-yaml`,
    });
  }
}

function filterDocumentPaths(
  document: OpenAPIObject,
  allowedPaths?: readonly string[],
): OpenAPIObject {
  if (!allowedPaths) {
    return document;
  }

  const allowedPathSet = new Set(allowedPaths);

  return {
    ...document,
    paths: Object.fromEntries(
      Object.entries(document.paths ?? {}).filter(([path]) =>
        allowedPathSet.has(path),
      ),
    ),
  };
}
