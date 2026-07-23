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
import { SessionsService } from './sessions.service';
import { StartSessionDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Roles('MANAGER', 'EMPLOYEE')
  @Post('start')
  start(@Request() req: any, @Body() dto: StartSessionDto) {
    return this.sessionsService.start(req.user.id, dto);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Post(':id/end')
  end(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.end(req.user.id, id);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Get('active')
  active(@Request() req: any) {
    return this.sessionsService.findActive(req.user.id);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Get('mine')
  mine(@Request() req: any) {
    return this.sessionsService.findMine(req.user.id);
  }

  @Roles('MANAGER')
  @Get('employee/:id')
  byEmployee(@Param('id', ParseUUIDPipe) id: string) {
    return this.sessionsService.findByEmployee(id);
  }
}
