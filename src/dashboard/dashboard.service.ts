import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getManagerDashboard() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const [
      totalActiveEmployees,
      totalActiveProjects,
      todayAttendance,
      summaryCounts,
      activeSessions,
      allEmployees,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'EMPLOYEE' } }),

      this.prisma.project.count({ where: { status: 'IN_PROGRESS' } }),

      this.prisma.attendance.findMany({
        where: { date: { gte: today, lt: tomorrow } },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),

      this.prisma.dailySummary.groupBy({
        by: ['status'],
        where: { date: { gte: today, lt: tomorrow } },
        _count: true,
      }),

      this.prisma.workSession.findMany({
        where: { endedAt: null },
        include: {
          user: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
      }),

      this.prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        select: { id: true, name: true, email: true },
      }),
    ]);

    const checkedInEmployeeIds = new Set(
      todayAttendance
        .filter((a) => a.checkInAt && !a.checkOutAt)
        .map((a) => a.userId),
    );

    const checkedIn = todayAttendance
      .filter((a) => checkedInEmployeeIds.has(a.userId))
      .map((a) => ({
        id: a.user.id,
        name: a.user.name,
        email: a.user.email,
        checkedInAt: a.checkInAt,
      }));

    const notCheckedIn = allEmployees
      .filter((u) => !checkedInEmployeeIds.has(u.id))
      .map((u) => ({ id: u.id, name: u.name, email: u.email }));

    const approvedCount =
      summaryCounts.find((s) => s.status === 'APPROVED')?._count ?? 0;
    const draftCount =
      summaryCounts.find((s) => s.status === 'DRAFT')?._count ?? 0;

    return {
      totalActiveEmployees,
      totalActiveProjects,
      attendance: { checkedIn, notCheckedIn },
      summaries: { approved: approvedCount, pending: draftCount },
      activeSessions: activeSessions
        .filter((s) => s.user)
        .map((s) => ({
          userId: s.user!.id,
          userName: s.user!.name,
          userEmail: s.user!.email,
          projectName: s.project?.name ?? null,
          startedAt: s.startedAt,
          source: s.source,
        })),
    };
  }
}
