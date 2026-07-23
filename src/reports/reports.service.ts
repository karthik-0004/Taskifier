import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async generate(userId: string, weekStartStr?: string) {
    const { weekStart, weekEnd } = weekStartStr
      ? weekRangeFromString(weekStartStr)
      : weekRangeFromDate(new Date());

    const summaries = await this.prisma.dailySummary.findMany({
      where: {
        userId,
        status: 'APPROVED',
        date: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { date: 'asc' },
    });

    if (summaries.length === 0) {
      return {
        message: `No approved summaries found for the week starting ${weekStart.toISOString().slice(0, 10)}. Generate and approve daily summaries first.`,
      };
    }

    const dailyContents = summaries.map((s) => s.editedContent ?? s.aiGeneratedContent);

    const reportContent = await this.ai.generateWeeklySummary(dailyContents);

    const report = await this.prisma.weeklyReport.upsert({
      where: { userId_weekStart: { userId, weekStart } },
      update: { content: reportContent },
      create: {
        userId,
        weekStart,
        content: reportContent,
      },
    });

    return report;
  }

  async findMine(userId: string) {
    return this.prisma.weeklyReport.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
    });
  }

  async findEmployee(employeeId: string, requesterId: string, role: string) {
    if (role !== 'MANAGER' && requesterId !== employeeId) {
      throw new ForbiddenException('You can only view your own reports');
    }

    return this.prisma.weeklyReport.findMany({
      where: { userId: employeeId },
      orderBy: { weekStart: 'desc' },
    });
  }

  async findTeam(weekStartStr?: string) {
    const where: any = {};

    if (weekStartStr) {
      const weekStart = new Date(weekStartStr + 'T00:00:00.000Z');
      where.weekStart = weekStart;
    }

    return this.prisma.weeklyReport.findMany({
      where,
      orderBy: { weekStart: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}

function weekRangeFromString(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00.000Z');
  if (isNaN(date.getTime())) {
    throw new BadRequestException('Invalid date format — use YYYY-MM-DD');
  }
  return weekRangeFromDate(date);
}

function weekRangeFromDate(date: Date) {
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(date);
  weekStart.setUTCDate(date.getUTCDate() + mondayOffset);
  weekStart.setUTCHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}
