const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/taskifier' }); // Assume default connection string or read from env
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const attendance = await prisma.attendance.findMany();
  
  // Find duplicates for the same user and logical date
  const map = new Map();
  for (const a of attendance) {
    const d = new Date(a.date);
    const dateKey = `${a.userId}-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (map.has(dateKey)) {
      console.log(`Duplicate found! Deleting ${a.id}`);
      await prisma.attendance.delete({ where: { id: a.id } });
    } else {
      map.set(dateKey, true);
    }
  }
  console.log('Done cleaning up duplicates.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
