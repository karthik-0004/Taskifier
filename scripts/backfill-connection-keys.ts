import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generateConnectionKey(): string {
  const randomSegment = () => Math.random().toString(36).substring(2, 6).toUpperCase().padStart(4, '0');
  return `TKF-${randomSegment()}-${randomSegment()}`;
}

async function main() {
  const users = await prisma.user.findMany({ where: { connectionKey: null } });
  console.log(`Found ${users.length} users needing a connection key.`);
  for (const user of users) {
    let key = generateConnectionKey();
    let unique = false;
    while (!unique) {
      const exists = await prisma.user.findUnique({ where: { connectionKey: key } });
      if (!exists) unique = true;
      else key = generateConnectionKey();
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { connectionKey: key },
    });
    console.log(`Updated user ${user.email} with key ${key}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
