import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceQueryDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles('MANAGER', 'EMPLOYEE')
  @Post('check-in')
  checkIn(@Request() req: any) {
    return this.attendanceService.checkIn(req.user.id);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Post('check-out')
  checkOut(@Request() req: any) {
    return this.attendanceService.checkOut(req.user.id);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Get('me')
  myAttendance(@Request() req: any) {
    return this.attendanceService.findMyAttendance(req.user.id);
  }

  @Roles('MANAGER')
  @Get()
  findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }
}
