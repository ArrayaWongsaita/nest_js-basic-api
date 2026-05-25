import type { AppConfig } from '../../../../bootstrap/config/app-config';
import { PrismaService } from '../../../../shared/infrastructure/database/prisma.service';
import type { PasswordHasher } from '../../application/ports/password-hasher.port';
import { seedIamAuthData } from './seed-iam-auth';
import { STUDENT_ROLE_NAME } from '../../domain/constants/role-name.constants';

const DEMO_STUDENT_PASSWORD = '1234567891011';
const DEMO_STUDENT_START_INDEX = 1;
const DEMO_STUDENT_END_INDEX = 60;

export async function seedIamDemoUsers(
  prisma: PrismaService,
  passwordHasher: PasswordHasher,
  appConfig: AppConfig,
): Promise<void> {
  await seedIamAuthData(prisma, passwordHasher, appConfig);

  const passwordHash = await passwordHasher.hash(DEMO_STUDENT_PASSWORD);

  for (
    let studentIndex = DEMO_STUDENT_START_INDEX;
    studentIndex <= DEMO_STUDENT_END_INDEX;
    studentIndex += 1
  ) {
    const email = `student${studentIndex}@mail.com`;

    await prisma.user.upsert({
      where: {
        email,
      },
      create: {
        email,
        passwordHash,
        isActive: true,
        isSystem: false,
        roles: {
          create: [
            {
              role: {
                connect: {
                  name: STUDENT_ROLE_NAME,
                },
              },
            },
          ],
        },
      },
      update: {
        passwordHash,
        isActive: true,
        isSystem: false,
        roles: {
          deleteMany: {},
          create: [
            {
              role: {
                connect: {
                  name: STUDENT_ROLE_NAME,
                },
              },
            },
          ],
        },
      },
    });
  }
}

export const IAM_DEMO_STUDENT_SEED = {
  password: DEMO_STUDENT_PASSWORD,
  roleName: STUDENT_ROLE_NAME,
  startIndex: DEMO_STUDENT_START_INDEX,
  endIndex: DEMO_STUDENT_END_INDEX,
} as const;
