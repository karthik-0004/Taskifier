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
    const active = await this.prisma.workSession.findFirst({
      where: { userId, endedAt: null },
    });

    if (active) {
      throw new ConflictException(
        'End your current session before starting a new one',
      );
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
