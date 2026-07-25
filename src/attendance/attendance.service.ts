import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceQueryDto } from './dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private todayStart(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  async checkIn(userId: string, source: any = 'WEB') {
    const date = this.todayStart();

    const existing = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (existing?.checkInAt) {
      if (!existing.checkOutAt) {
        throw new ConflictException(
          `You already have an active session today, started at ${existing.checkInAt.toISOString()}.`
        );
      } else {
        throw new ConflictException(
          "Today's session has already been completed. You can start a new session tomorrow."
        );
      }
    }

    const now = new Date();

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: { checkInAt: now, checkInSource: source },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    }

    return this.prisma.attendance.create({
      data: { userId, date, checkInAt: now, checkInSource: source },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async checkOut(userId: string, source: any = 'WEB') {
    const date = this.todayStart();

    const record = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (!record?.checkInAt) {
      throw new BadRequestException('Must check in before checking out');
    }

    if (record.checkOutAt) {
      throw new ConflictException(
        "Today's session has already been completed. You can start a new session tomorrow."
      );
    }

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: { checkOutAt: new Date(), checkOutSource: source },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  findMyAttendance(userId: string) {
    return this.prisma.attendance.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  findAll(query: AttendanceQueryDto) {
    const where: any = {};

    if (query.employeeId) {
      where.userId = query.employeeId;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, position: true } },
      },
    });
  }
}
