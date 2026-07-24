import { Controller, Get, Req, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles('MANAGER')
  @Get()
  async getManagerDashboard(
    @Req() req: any,
    @Query('date') date: string
  ) {
    if (!date) {
      date = new Date().toISOString().slice(0, 10);
    }
    return this.dashboardService.getManagerDashboard(req.user.id, date);
  }

  @Roles('EMPLOYEE')
  @Get('me')
  async getMyDashboard(
    @Req() req: any,
    @Query('date') date: string
  ) {
    if (!date) {
      date = new Date().toISOString().slice(0, 10);
    }
    return this.dashboardService.getDashboard(req.user.id, date);
  }
}
