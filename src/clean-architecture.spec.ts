import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const srcRoot = __dirname;
const forbiddenDomainImports = ['@nestjs/', '@prisma/client'];
const forbiddenApplicationImports = ['@nestjs/', '@prisma/client'];

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      return listTypeScriptFiles(fullPath);
    }

    if (!fullPath.endsWith('.ts') || fullPath.endsWith('.spec.ts')) {
      return [];
    }

    return [fullPath];
  });
}

describe('Clean architecture boundaries', () => {
  it('keeps domain files free from Nest and Prisma imports', () => {
    const domainRoot = join(srcRoot, 'contexts');
    const domainFiles = listTypeScriptFiles(domainRoot).filter((filePath) =>
      filePath.includes('/domain/'),
    );

    for (const filePath of domainFiles) {
      const source = readFileSync(filePath, 'utf8');

      for (const forbiddenImport of forbiddenDomainImports) {
        expect(source).not.toContain(forbiddenImport);
      }
    }
  });

  it('keeps application files free from Nest and Prisma imports', () => {
    const applicationRoot = join(srcRoot, 'contexts');
    const applicationFiles = listTypeScriptFiles(applicationRoot).filter(
      (filePath) => filePath.includes('/application/'),
    );

    for (const filePath of applicationFiles) {
      const source = readFileSync(filePath, 'utf8');

      for (const forbiddenImport of forbiddenApplicationImports) {
        expect(source).not.toContain(forbiddenImport);
      }
    }
  });
});
