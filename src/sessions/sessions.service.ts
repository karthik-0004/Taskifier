import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async start(userId: string, dto: StartSessionDto) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const activeSession = await this.prisma.workSession.findFirst({
      where: {
        userId,
        endedAt: null,
      },
    });

    if (activeSession) {
      throw new ConflictException(
        `You already have an active session, started at ${activeSession.startedAt.toISOString()}.`
      );
    }

    const date = todayStart;

    // Auto-check in if not already checked in
    const existingAttendance = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });
    
    if (existingAttendance?.checkOutAt) {
      throw new ConflictException(
        "Today's work has already been completed (checked out). You can start a new session tomorrow."
      );
    }
    
    if (!existingAttendance) {
      await this.prisma.attendance.create({
        data: { userId, date, checkInAt: now },
      });
    } else if (!existingAttendance.checkInAt) {
      await this.prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { checkInAt: now },
      });
    }

    return this.prisma.workSession.create({
      data: {
        userId,
        projectId: dto.projectId ?? null,
        source: dto.source,
        startedAt: new Date(),
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  }

  async end(userId: string, sessionId: string) {
    const session = await this.prisma.workSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('You can only end your own sessions');
    }

    if (session.endedAt) {
      throw new BadRequestException('Session is already ended');
    }

    return this.prisma.workSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  }

  findActive(userId: string) {
    return this.prisma.workSession.findFirst({
      where: { userId, endedAt: null },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  }

  findMine(userId: string) {
    return this.prisma.workSession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  }

  findByEmployee(employeeId: string) {
    return this.prisma.workSession.findMany({
      where: { userId: employeeId },
      orderBy: { startedAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
      },
    });
  }
}
