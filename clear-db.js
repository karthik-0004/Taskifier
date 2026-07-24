const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clear() {
  console.log('Clearing testing data...');
  await prisma.attendance.deleteMany({});
  await prisma.workUpdate.deleteMany({});
  await prisma.workSession.deleteMany({});
  await prisma.dailySummary.deleteMany({});
  console.log('✅ Cleared all Attendances, Sessions, Updates, and Summaries!');
}

clear().catch(console.error).finally(() => prisma.$disconnect());
