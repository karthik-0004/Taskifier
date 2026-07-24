import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SummariesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async generate(userId: string, dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00.000Z');

    const existing = await this.prisma.dailySummary.findUnique({
      where: { userId_date: { userId, date } },
      select: { status: true },
    });

    if (existing && existing.status !== 'DRAFT') {
      throw new ConflictException(
        `Cannot regenerate: summary for ${dateStr} is already ${existing.status.toLowerCase()}`,
      );
    }

    const { generatedText } = await this.ai.generateDailySummary(userId, dateStr);

    const summary = await this.prisma.dailySummary.upsert({
      where: { userId_date: { userId, date } },
      update: { aiGeneratedContent: generatedText },
      create: {
        userId,
        date,
        aiGeneratedContent: generatedText,
        status: 'DRAFT',
      },
    });

    return summary;
  }

  async createManual(userId: string, dateStr: string, content: string) {
    const date = new Date(dateStr + 'T00:00:00.000Z');

    const existing = await this.prisma.dailySummary.findUnique({
      where: { userId_date: { userId, date } },
      select: { status: true },
    });

    if (existing && existing.status !== 'DRAFT') {
      throw new ConflictException(
        `Cannot recreate: summary for ${dateStr} is already ${existing.status.toLowerCase()}`,
      );
    }

    const summary = await this.prisma.dailySummary.upsert({
      where: { userId_date: { userId, date } },
      update: { editedContent: content, status: 'APPROVED', approvedAt: new Date() },
      create: {
        userId,
        date,
        editedContent: content,
        aiGeneratedContent: 'Manual Entry',
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    return summary;
  }

  async findMine(userId: string) {
    return this.prisma.dailySummary.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async findTeamApproved(params: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = { status: 'APPROVED' };

    if (params.employeeId) {
      where.userId = params.employeeId;
    }

    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) {
        where.date.gte = new Date(params.startDate + 'T00:00:00.000Z');
      }
      if (params.endDate) {
        where.date.lte = new Date(params.endDate + 'T23:59:59.999Z');
      }
    }

    return this.prisma.dailySummary.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findEmployeeApproved(employeeId: string) {
    return this.prisma.dailySummary.findMany({
      where: { userId: employeeId, status: 'APPROVED' },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const summary = await this.prisma.dailySummary.findUnique({
      where: { id },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    if (role === 'MANAGER') {
      if (summary.status !== 'APPROVED') {
        throw new NotFoundException('Summary not found');
      }
      return summary;
    }

    if (summary.userId !== userId) {
      throw new ForbiddenException('You can only view your own summaries');
    }

    return summary;
  }

  async edit(id: string, userId: string, editedContent: string) {
    const summary = await this.getOwnDraft(id, userId);

    return this.prisma.dailySummary.update({
      where: { id },
      data: { editedContent },
    });
  }

  async approve(id: string, userId: string) {
    await this.getOwnDraft(id, userId);

    return this.prisma.dailySummary.update({
      where: { id },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });
  }

  async reject(id: string, userId: string) {
    await this.getOwnDraft(id, userId);

    return this.prisma.dailySummary.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async findProjectDaily(projectId: string, dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00.000Z');
    const nextDay = new Date(date);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        assignments: {
          include: { user: { select: { id: true, name: true, email: true, position: true, skills: true } } },
        },
        teamLead: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    const employeeIds = project.assignments.map((a) => a.userId);

    const [attendanceRecords, summaries, sessions] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { userId: { in: employeeIds }, date: { gte: date, lt: nextDay } },
      }),
      this.prisma.dailySummary.findMany({
        where: { userId: { in: employeeIds }, date: { gte: date, lt: nextDay } },
      }),
      this.prisma.workSession.findMany({
        where: { userId: { in: employeeIds }, startedAt: { gte: date, lt: nextDay } },
        include: { activityEvents: { orderBy: { timestamp: 'asc' } } },
      }),
    ]);

    const employees = project.assignments.map((a) => {
      const attendance = attendanceRecords.find((ar) => ar.userId === a.userId);
      const summary = summaries.find((s) => s.userId === a.userId);
      const userSessions = sessions.filter((s) => s.userId === a.userId);
      const allEvents = userSessions.flatMap((s) => s.activityEvents);
      const totalMinutes = userSessions.reduce((acc, s) => {
        if (!s.endedAt) return acc;
        return acc + (s.endedAt.getTime() - s.startedAt.getTime()) / 60000;
      }, 0);

      return {
        userId: a.userId,
        name: a.user.name,
        email: a.user.email,
        position: a.user.position,
        skills: a.user.skills,
        role: a.role,
        workload: a.workload,
        joiningDate: a.joiningDate,
        checkIn: attendance?.checkInAt ?? null,
        checkOut: attendance?.checkOutAt ?? null,
        totalMinutes: Math.round(totalMinutes),
        commitCount: allEvents.filter((e) => e.type === 'COMMIT').length,
        fileEditCount: allEvents.filter((e) => e.type === 'FILE_EDIT').length,
        activityEvents: allEvents,
        summaryId: summary?.id ?? null,
        summaryContent: summary?.editedContent ?? summary?.aiGeneratedContent ?? null,
        summaryStatus: summary?.status ?? null,
      };
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        code: project.code,
        status: project.status,
        priority: project.priority,
        category: project.category,
        description: project.description,
        teamLead: project.teamLead,
        manager: project.manager,
        totalMembers: project.assignments.length,
      },
      date: dateStr,
      employees,
    };
  }

  private async getOwnDraft(id: string, userId: string) {
    const summary = await this.prisma.dailySummary.findUnique({
      where: { id },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    if (summary.userId !== userId) {
      throw new ForbiddenException('You can only edit your own summaries');
    }

    if (summary.status !== 'DRAFT') {
      throw new ConflictException(
        `Cannot modify a summary with status ${summary.status.toLowerCase()}`,
      );
    }

    return summary;
  }
}
