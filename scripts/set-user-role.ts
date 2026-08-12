import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '../prisma/generated/client/client';

async function main() {
  const [rawEmail, rawRole] = process.argv
    .slice(2)
    .filter((argument) => argument !== '--');
  const email = rawEmail?.trim().toLowerCase();
  const role = rawRole?.trim().toUpperCase() as Role | undefined;
  if (!email || !role || !Object.values(Role).includes(role)) {
    throw new Error('Usage: pnpm user:set-role -- user@example.com ADMIN');
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is required.');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    console.info(`Role updated: ${user.email} -> ${user.role}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
