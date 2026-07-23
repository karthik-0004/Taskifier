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
