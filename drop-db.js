const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/taskifier' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await prisma.$disconnect();
}
main();
