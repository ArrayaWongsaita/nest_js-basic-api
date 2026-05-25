import { Request, Response, NextFunction } from 'express';

export type SwaggerBasicAuthOptions = {
  readonly username: string;
  readonly password: string;
};

export function createSwaggerBasicAuthMiddleware(
  options: SwaggerBasicAuthOptions,
) {
  return (
    request: Request,
    response: Response,
    next: NextFunction,
  ): void => {
    const credentials = readBasicAuthCredentials(request);

    if (
      credentials?.username === options.username &&
      credentials.password === options.password
    ) {
      next();

      return;
    }

    response.setHeader('WWW-Authenticate', 'Basic realm="Swagger Docs"');
    response.status(401).send('Swagger documentation requires authentication.');
  };
}

function readBasicAuthCredentials(
  request: Request,
): { username: string; password: string } | null {
  const authorizationHeader = request.header('authorization');

  if (!authorizationHeader?.startsWith('Basic ')) {
    return null;
  }

  const encodedCredentials = authorizationHeader.slice('Basic '.length).trim();

  if (!encodedCredentials) {
    return null;
  }

  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString(
    'utf8',
  );
  const separatorIndex = decodedCredentials.indexOf(':');

  if (separatorIndex < 0) {
    return null;
  }

  return {
    username: decodedCredentials.slice(0, separatorIndex),
    password: decodedCredentials.slice(separatorIndex + 1),
  };
}
