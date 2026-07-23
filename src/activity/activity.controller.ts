import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityEventDto, CreateActivityEventsDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('activity')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Roles('MANAGER', 'EMPLOYEE')
  @Post()
  create(@Request() req: any, @Body() dto: CreateActivityEventDto) {
    return this.activityService.create(req.user.id, dto);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Post('bulk')
  createBulk(@Request() req: any, @Body() dto: CreateActivityEventsDto) {
    return this.activityService.createBulk(req.user.id, dto);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Get('session/:sessionId')
  findBySession(
    @Request() req: any,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.activityService.findBySession(sessionId, req.user.id, req.user.role);
  }
}
