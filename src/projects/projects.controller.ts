import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, AssignEmployeeDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles('MANAGER', 'EMPLOYEE')
  @Get('mine')
  findMine(@Request() req: any) {
    return this.projectsService.findMine(req.user.id);
  }

  @Roles('MANAGER')
  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Roles('MANAGER')
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Roles('MANAGER')
  @Get(':id/employees')
  getEmployees(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.getEmployees(id);
  }

  @Roles('MANAGER')
  @Post(':id/assign')
  assignEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignEmployeeDto,
  ) {
    return this.projectsService.assignEmployee(id, dto.employeeId);
  }

  @Roles('MANAGER')
  @Delete(':id/assign/:employeeId')
  unassignEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    return this.projectsService.unassignEmployee(id, employeeId);
  }

  @Roles('MANAGER')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.findOne(id);
  }

  @Roles('MANAGER')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Roles('MANAGER')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectsService.remove(id);
  }
}
