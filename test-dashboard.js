const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
    const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/taskifier' });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    
    // Import the service directly to test its output shape accurately
    const { DashboardService } = require('./dist/src/dashboard/dashboard.service.js');
    const service = new DashboardService(prisma);
    
    const user = await prisma.user.findFirst({ where: { email: 'ep3@yopmail.com' } });
    const userId = user.id;
    const dateStr = new Date().toISOString().slice(0, 10);
    const today = new Date(dateStr + 'T00:00:00.000Z');
    
    console.log("=== STATE 1: Before Check-In ===");
    // Delete any today's data
    await prisma.dailySummary.deleteMany({ where: { userId, date: { gte: today } } });
    await prisma.workUpdate.deleteMany({ where: { userId, createdAt: { gte: today } } });
    await prisma.workSession.deleteMany({ where: { userId, startedAt: { gte: today } } });
    await prisma.attendance.deleteMany({ where: { userId, date: { gte: today } } });
    
    console.log(JSON.stringify(await service.getDashboard(userId, dateStr), null, 2));
    
    console.log("\n=== STATE 2: After Check-In, No Session ===");
    await prisma.attendance.create({
        data: {
            userId,
            date: today,
            checkInAt: new Date()
        }
    });
    console.log(JSON.stringify(await service.getDashboard(userId, dateStr), null, 2));
    
    console.log("\n=== STATE 3: Active Session & Updates ===");
    const project = await prisma.project.findFirst();
    const session = await prisma.workSession.create({
        data: {
            userId,
            projectId: project.id,
            source: 'VSCODE',
            startedAt: new Date()
        }
    });
    await prisma.workUpdate.create({
        data: {
            userId,
            sessionId: session.id,
            rawCommits: [
                { hash: 'abcd123', message: 'test commit 1' },
                { hash: 'efgh456', message: 'test commit 2' }
            ],
            finalContent: 'Commits:\n- test commit 1\n- test commit 2',
        }
    });
    
    console.log(JSON.stringify(await service.getDashboard(userId, dateStr), null, 2));

    await prisma.$disconnect();
    pool.end();
}
main();
