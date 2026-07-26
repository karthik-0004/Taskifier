import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@taskifier.dev' },
    update: {},
    create: {
      email: 'superadmin@taskifier.dev',
      passwordHash,
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
    },
  });

  // 2. Create the Organization (TechCorp Inc.)
  const org = await prisma.organization.create({
    data: {
      name: 'TechCorp Inc.',
      createdBySuperAdminId: superAdmin.id,
    },
  });

  // 3. Create Organization Role (Owner)
  const ownerRole = await prisma.organizationRole.create({
    data: {
      organizationId: org.id,
      name: 'Owner',
      isOwnerRole: true,
      permissions: {
        create: [
          { permissionKey: 'MANAGE_MEMBERS' },
          { permissionKey: 'CREATE_ROLES' },
          { permissionKey: 'INVITE_EMPLOYEES' },
          { permissionKey: 'MANAGE_PROJECTS' },
          { permissionKey: 'VIEW_TEAM_SUMMARIES' },
          { permissionKey: 'VIEW_REPORTS' },
          { permissionKey: 'MANAGE_ATTENDANCE' },
        ],
      },
    },
  });

  // 4. Create Sarah (Organization Owner)
  await prisma.user.upsert({
    where: { email: 'manager@taskifier.dev' },
    update: {
      organizationId: org.id,
      organizationRoleId: ownerRole.id,
      name: 'Sarah Connor (Owner)',
      role: Role.MANAGER,
    },
    create: {
      email: 'manager@taskifier.dev',
      passwordHash,
      name: 'Sarah Connor (Owner)',
      role: Role.MANAGER,
      organizationId: org.id,
      organizationRoleId: ownerRole.id,
    },
  });

  console.log('Seed completed: Multi-tenancy setup with Super Admin and Organization Owner');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
