import { Module } from '@nestjs/common';
import { UpdatesController } from './updates.controller';
import { UpdatesService } from './updates.service';
import { TestUpdateController } from './test-update.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [UpdatesController, TestUpdateController],
  providers: [UpdatesService],
  exports: [UpdatesService],
})
export class UpdatesModule {}
