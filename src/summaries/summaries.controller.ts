import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SummariesService } from './summaries.service';
import { EditSummaryDto } from './dto/edit-summary.dto';
import { TeamQueryDto } from './dto/team-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('summaries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Roles('MANAGER', 'EMPLOYEE')
  @Post('generate')
  generate(@Req() req: any, @Query('date') date: string) {
    if (!date) {
      date = new Date().toISOString().slice(0, 10);
    }
    return this.summariesService.generate(req.user.id, date);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Get('mine')
  mine(@Req() req: any) {
    return this.summariesService.findMine(req.user.id);
  }

  @Roles('MANAGER')
  @Get('team')
  team(@Query() query: TeamQueryDto) {
    return this.summariesService.findTeamApproved(query);
  }

  @Roles('MANAGER')
  @Get('employee/:id')
  employeeSummaries(@Param('id', ParseUUIDPipe) id: string) {
    return this.summariesService.findEmployeeApproved(id);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Patch(':id')
  edit(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditSummaryDto,
  ) {
    return this.summariesService.edit(id, req.user.id, dto.editedContent);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Post(':id/approve')
  approve(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.summariesService.approve(id, req.user.id);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Post(':id/reject')
  reject(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.summariesService.reject(id, req.user.id);
  }

  @Roles('MANAGER', 'EMPLOYEE')
  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.summariesService.findOne(id, req.user.id, req.user.role);
  }
}
