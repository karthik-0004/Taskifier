import { PrismaClient, Role, ProjectStatus, SessionSource, ActivityType, SummaryStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // --- Users ---
  const manager = await prisma.user.create({
    data: {
      email: 'manager@taskifier.dev',
      passwordHash,
      name: 'Alice Chen',
      role: Role.MANAGER,
      githubUsername: 'alicechen',
    },
  });

  const emp1 = await prisma.user.create({
    data: {
      email: 'bob@taskifier.dev',
      passwordHash,
      name: 'Bob Martinez',
      role: Role.EMPLOYEE,
      githubUsername: 'bobmartinez',
    },
  });

  const emp2 = await prisma.user.create({
    data: {
      email: 'carol@taskifier.dev',
      passwordHash,
      name: 'Carol Nguyen',
      role: Role.EMPLOYEE,
      githubUsername: 'carolnguyen',
    },
  });

  const emp3 = await prisma.user.create({
    data: {
      email: 'dave@taskifier.dev',
      passwordHash,
      name: 'Dave Patel',
      role: Role.EMPLOYEE,
      githubUsername: 'davepatel',
    },
  });

  // --- Projects ---
  const projectA = await prisma.project.create({
    data: {
      name: 'Taskifier Dashboard',
      description: 'Real-time engineering metrics dashboard',
      status: ProjectStatus.ACTIVE,
    },
  });

  const projectB = await prisma.project.create({
    data: {
      name: 'AI Code Analyzer',
      description: 'Automated code review and analysis engine',
      status: ProjectStatus.ACTIVE,
    },
  });

  // --- Assignments ---
  await prisma.projectAssignment.createMany({
    data: [
      { userId: emp1.id, projectId: projectA.id },
      { userId: emp1.id, projectId: projectB.id },
      { userId: emp2.id, projectId: projectA.id },
      { userId: emp3.id, projectId: projectB.id },
    ],
  });

  // --- Work Sessions & Activity Events for Bob (emp1) ---
  const now = new Date();

  const session1 = await prisma.workSession.create({
    data: {
      userId: emp1.id,
      projectId: projectA.id,
      startedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      endedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      source: SessionSource.VSCODE,
    },
  });

  await prisma.activityEvent.createMany({
    data: [
      {
        sessionId: session1.id,
        type: ActivityType.FILE_EDIT,
        payload: { file: 'src/app.module.ts', linesChanged: 12 },
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000 + 5 * 60 * 1000),
      },
      {
        sessionId: session1.id,
        type: ActivityType.COMMIT,
        payload: { hash: 'a1b2c3d', message: 'feat: add dashboard layout', branch: 'main' },
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000 + 30 * 60 * 1000),
      },
      {
        sessionId: session1.id,
        type: ActivityType.BRANCH_SWITCH,
        payload: { from: 'main', to: 'feat/dashboard' },
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000 + 45 * 60 * 1000),
      },
    ],
  });

  const session2 = await prisma.workSession.create({
    data: {
      userId: emp1.id,
      projectId: projectB.id,
      startedAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
      endedAt: null,
      source: SessionSource.CURSOR,
    },
  });

  await prisma.activityEvent.create({
    data: {
      sessionId: session2.id,
      type: ActivityType.PR_OPENED,
      payload: { number: 42, title: 'Add rate limiting middleware', url: 'https://github.com/taskifier/ai-code-analyzer/pull/42' },
      timestamp: new Date(now.getTime() - 0.5 * 60 * 60 * 1000),
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
