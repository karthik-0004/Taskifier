import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityEventDto, CreateActivityEventsDto } from './dto';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateSessionOwnership(sessionId: string, userId: string) {
    const session = await this.prisma.workSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Session does not belong to you');
    }

    if (session.endedAt) {
      throw new BadRequestException('Session is already ended');
    }

    return session;
  }

  async create(userId: string, dto: CreateActivityEventDto) {
    await this.validateSessionOwnership(dto.sessionId, userId);

    return this.prisma.activityEvent.create({
      data: {
        sessionId: dto.sessionId,
        type: dto.type,
        payload: dto.payload,
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      },
    });
  }

  async createBulk(userId: string, dto: CreateActivityEventsDto) {
    for (const event of dto.events) {
      await this.validateSessionOwnership(event.sessionId, userId);
    }

    return this.prisma.activityEvent.createMany({
      data: dto.events.map((e) => ({
        sessionId: e.sessionId,
        type: e.type,
        payload: e.payload,
        timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
      })),
    });
  }

  async findBySession(sessionId: string, userId: string, userRole: string) {
    const session = await this.prisma.workSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.userId !== userId && userRole !== 'MANAGER') {
      throw new ForbiddenException(
        'You can only view your own session events',
      );
    }

    return this.prisma.activityEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
    });
  }
}
