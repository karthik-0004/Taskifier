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
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports/weekly')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles('MANAGER', 'EMPLOYEE')
  @Post('generate')
  generate(
    @Req() req: any,
    @Query('weekStart') weekStart?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const targetUserId =
      employeeId && req.user.role === 'MANAGER' ? employeeId : req.user.id;

    if (employeeId && req.user.role !== 'MANAGER') {
      throw new ForbiddenException('Only managers can generate for other employees');
    }

    return this.reportsService.generate(targetUserId, weekStart);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Get('mine')
  mine(@Req() req: any) {
    return this.reportsService.findMine(req.user.id);
  }

  @Roles('MANAGER')
  @Get('employee/:id')
  employee(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reportsService.findEmployee(id, id, 'MANAGER');
  }

  @Roles('MANAGER')
  @Get('team')
  team(@Query('weekStart') weekStart?: string) {
    return this.reportsService.findTeam(weekStart);
  }
}
