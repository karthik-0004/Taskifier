import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Controller('test-update')
export class TestUpdateController {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  @Get()
  async test() {
    const user = await this.prisma.user.findFirst({ where: { email: 'ep3@yopmail.com' } });
    if (!user) return 'User not found';

    const update = await this.prisma.workUpdate.create({
      data: {
        userId: user.id,
        rawCommits: [{ message: 'test commit' }],
        finalContent: 'This is my final manual update for today'
      }
    });

    const context = await this.ai.buildDayContext(user.id, new Date().toISOString().split('T')[0]);

    return { update, context };
  }
}
