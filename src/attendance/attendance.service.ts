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
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  async checkIn(userId: string) {
    const date = this.todayStart();

    const existing = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (existing?.checkInAt) {
      throw new ConflictException('Already checked in today');
    }

    const now = new Date();

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: { checkInAt: now },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    }

    return this.prisma.attendance.create({
      data: { userId, date, checkInAt: now },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async checkOut(userId: string) {
    const date = this.todayStart();

    const record = await this.prisma.attendance.findUnique({
      where: { userId_date: { userId, date } },
    });

    if (!record?.checkInAt) {
      throw new BadRequestException('Must check in before checking out');
    }

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: { checkOutAt: new Date() },
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
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }
}
