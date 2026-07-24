import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string, dateStr: string) {
    const today = new Date(dateStr + 'T00:00:00.000Z');
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Parallel execution for maximum efficiency
    const [user, attendance, sessions, updates, summary] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, organizationId: true },
      }),
      this.prisma.attendance.findFirst({
        where: { userId, date: { gte: today, lt: tomorrow } },
        select: { checkInAt: true, checkOutAt: true, checkInSource: true, checkOutSource: true },
      }),
      this.prisma.workSession.findMany({
        where: { userId, startedAt: { gte: today, lt: tomorrow } },
        include: { project: { select: { name: true } } },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.workUpdate.findMany({
        where: { userId, createdAt: { gte: today, lt: tomorrow } },
        select: { rawCommits: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.dailySummary.findFirst({
        where: { userId, date: { gte: today, lt: tomorrow } },
        select: { status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Active session
    const activeSession = sessions.find(s => !s.endedAt) || null;
    let mappedActiveSession: any = null;
    if (activeSession) {
      mappedActiveSession = {
        id: activeSession.id,
        projectName: activeSession.project?.name || 'Unknown',
        startedAt: activeSession.startedAt,
      };
    }

    // Last ended session (only relevant if no active session, but we can compute it anyway)
    let lastEndedSession: any = null;
    const endedSessions = sessions.filter(s => s.endedAt);
    if (!activeSession && endedSessions.length > 0) {
      const mostRecent = endedSessions[0]; // ordered desc
      const durationMs = mostRecent.endedAt!.getTime() - mostRecent.startedAt.getTime();
      lastEndedSession = {
        projectName: mostRecent.project?.name || 'Unknown',
        startedAt: mostRecent.startedAt,
        endedAt: mostRecent.endedAt,
        durationMinutes: Math.round(durationMs / 60000),
      };
    }

    // Compute stats from WorkUpdates
    let totalCommitsSynced = 0;
    updates.forEach(u => {
      if (u.rawCommits && Array.isArray(u.rawCommits)) {
        totalCommitsSynced += u.rawCommits.length;
      }
    });

    return {
      employee: user,
      attendance: attendance
        ? { 
            checkedInAt: attendance.checkInAt, 
            checkedOutAt: attendance.checkOutAt,
            checkInSource: attendance.checkInSource,
            checkOutSource: attendance.checkOutSource
          }
        : { checkedInAt: null, checkedOutAt: null, checkInSource: null, checkOutSource: null },
      activeSession: mappedActiveSession,
      lastEndedSession,
      todayStats: {
        totalCommitsSynced,
        filesEditedCount: 0, // Not available because extension only collects { hash, message } to be lightweight
        updatesSubmittedCount: updates.length,
        updateTimestamps: updates.map(u => {
          let fileCount = 0;
          if (u.rawCommits && Array.isArray(u.rawCommits)) {
            u.rawCommits.forEach((c: any) => {
              if (c.filesChanged) {
                if (Array.isArray(c.filesChanged)) fileCount += c.filesChanged.length;
                else if (typeof c.filesChanged === 'number') fileCount += c.filesChanged;
                else fileCount += 1;
              } else {
                fileCount += 1;
              }
            });
          }
          return { createdAt: u.createdAt, fileCount };
        }),
      },
      summaryStatus: summary?.status || 'NONE',
      summaryGeneratedAt: summary?.createdAt || null,
    };
  }

  async getManagerDashboard(managerId: string, dateStr: string) {
    const today = new Date(dateStr + 'T00:00:00.000Z');
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { organizationId: true },
    });

    if (!manager?.organizationId) {
      throw new Error('Manager has no organization');
    }
    const orgId = manager.organizationId;

    const [totalActiveEmployees, totalActiveProjects, employees, sessions] = await Promise.all([
      this.prisma.user.count({ where: { organizationId: orgId, role: 'EMPLOYEE' } }),
      this.prisma.project.count({ where: { managerId, status: { notIn: ['COMPLETED', 'ON_HOLD'] } } }),
      this.prisma.user.findMany({
        where: { organizationId: orgId, role: 'EMPLOYEE' },
        select: { id: true, name: true, email: true },
      }),
      this.prisma.workSession.findMany({
        where: { user: { organizationId: orgId }, endedAt: null },
        include: { user: { select: { name: true, email: true } }, project: { select: { name: true } } },
      }),
    ]);

    const employeeIds = employees.map(e => e.id);

    const [attendance, summaries] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { userId: { in: employeeIds }, date: { gte: today, lt: tomorrow } },
        select: { userId: true, checkInAt: true, checkOutAt: true, checkInSource: true, checkOutSource: true },
      }),
      this.prisma.dailySummary.findMany({
        where: { userId: { in: employeeIds }, date: { gte: today, lt: tomorrow } },
        select: { status: true },
      }),
    ]);

    const checkedIn: any[] = [];
    const notCheckedIn: any[] = [];

    for (const emp of employees) {
      const record = attendance.find(a => a.userId === emp.id);
      if (record && record.checkInAt) {
        checkedIn.push({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          checkedInAt: record.checkInAt.toISOString(),
          checkedOutAt: record.checkOutAt ? record.checkOutAt.toISOString() : null,
          checkInSource: record.checkInSource,
          checkOutSource: record.checkOutSource
        });
      } else {
        notCheckedIn.push({
          id: emp.id,
          name: emp.name,
          email: emp.email,
        });
      }
    }

    const approvedCount = summaries.filter(s => s.status === 'APPROVED').length;
    const pendingCount = summaries.filter(s => s.status === 'DRAFT').length;

    const activeSessions = sessions.map(s => ({
      userId: s.userId,
      userName: s.user?.name || 'Unknown',
      userEmail: s.user?.email || 'Unknown',
      projectName: s.project?.name || null,
      startedAt: s.startedAt.toISOString(),
      source: s.source,
    }));

    return {
      totalActiveEmployees,
      totalActiveProjects,
      attendance: { checkedIn, notCheckedIn },
      summaries: { approved: approvedCount, pending: pendingCount },
      activeSessions,
    };
  }
}
