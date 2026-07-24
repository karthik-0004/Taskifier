import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
  Body,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { EnhanceUpdateDto } from './dto/enhance-update.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Roles('MANAGER', 'EMPLOYEE')
  @Get('context/:userId')
  getDayContext(
    @Req() req: any,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('date') date: string,
  ) {
    if (req.user.role !== 'MANAGER' && req.user.id !== userId) {
      throw new ForbiddenException('You can only view your own AI context');
    }

    if (!date) {
      date = new Date().toISOString().slice(0, 10);
    }

    return this.aiService.buildDayContext(userId, date);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Post('generate/:userId')
  generate(
    @Req() req: any,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('date') date: string,
  ) {
    if (req.user.role !== 'MANAGER' && req.user.id !== userId) {
      throw new ForbiddenException('You can only generate for yourself');
    }

    if (!date) {
      date = new Date().toISOString().slice(0, 10);
    }

    return this.aiService.generateDailySummary(userId, date);
  }

  @Roles('EMPLOYEE')
  @Post('enhance-update')
  async enhanceUpdate(@Body() dto: EnhanceUpdateDto) {
    return this.aiService.enhanceUpdate(dto.rawCommits, dto.manualNote);
  }
}
