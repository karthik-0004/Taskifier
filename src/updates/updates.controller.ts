import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { UpdatesService } from './updates.service';
import { CreateUpdateDto } from './dto/create-update.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('updates')
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Roles('EMPLOYEE')
  @Post()
  createUpdate(@Request() req: any, @Body() dto: CreateUpdateDto) {
    return this.updatesService.createUpdate(req.user.id, dto);
  }

  @Roles('EMPLOYEE')
  @Get('mine/today')
  getTodayUpdates(@Request() req: any) {
    return this.updatesService.getTodayUpdates(req.user.id);
  }

  @Roles('EMPLOYEE')
  @Get('mine')
  getMyUpdates(@Request() req: any) {
    return this.updatesService.getMyUpdates(req.user.id);
  }

  // EXPLICIT BOUNDARY: Do not add manager-facing endpoints here.
  // Work Updates are strictly employee-only notes that feed into the AI summary.
  // Managers should only see the final approved daily summaries, not these raw/intermediate notes.
}
