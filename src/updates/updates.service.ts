import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUpdateDto } from './dto/create-update.dto';

@Injectable()
export class UpdatesService {
  constructor(private readonly prisma: PrismaService) {}

  async createUpdate(userId: string, dto: CreateUpdateDto) {
    return this.prisma.workUpdate.create({
      data: {
        userId,
        sessionId: dto.sessionId,
        rawCommits: dto.rawCommits,
        manualNote: dto.manualNote,
        aiEnhancedContent: dto.aiEnhancedContent,
        finalContent: dto.finalContent,
      },
    });
  }

  async getTodayUpdates(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.workUpdate.findMany({
      where: {
        userId,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyUpdates(userId: string) {
    return this.prisma.workUpdate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // simple pagination/limit for history
    });
  }
}
