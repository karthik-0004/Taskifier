import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateProjectDto, UpdateProjectDto, AssignEmployeeDto } from './dto';

const projectInclude = {
  assignments: {
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, position: true, skills: true },
      },
    },
  },
  projectManager: { select: { id: true, name: true, email: true } },
  teamLead: { select: { id: true, name: true, email: true } },
  manager: { select: { id: true, name: true, email: true } },
} as const;

function generateCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 5);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  findAll() {
    return this.prisma.project.findMany({
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateProjectDto, managerId: string) {
    const code = dto.code || generateCode(dto.name);

    const existing = await this.prisma.project.findUnique({ where: { code } });
    if (existing) {
      throw new ConflictException(`Project code "${code}" already exists`);
    }

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        code,
        description: dto.description,
        category: dto.category,
        clientName: dto.clientName,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        expectedEndDate: dto.expectedEndDate ? new Date(dto.expectedEndDate) : undefined,
        priority: dto.priority,
        status: dto.status ?? 'NOT_STARTED',
        projectManagerId: managerId,
        teamLeadId: dto.teamLeadId,
        maxTeamSize: dto.maxTeamSize,
        estimatedDuration: dto.estimatedDuration,
        budget: dto.budget,
        techStack: dto.techStack,
        requiredSkills: dto.requiredSkills,
        repoUrl: dto.repoUrl,
        docsUrl: dto.docsUrl,
        tags: dto.tags,
        managerId,
        assignments: dto.assignments?.length
          ? {
              create: dto.assignments.map((a) => ({
                userId: a.employeeId,
                role: a.role ?? 'OTHER',
                workload: a.workload,
                joiningDate: a.joiningDate ? new Date(a.joiningDate) : undefined,
              })),
            }
          : undefined,
      },
      include: projectInclude,
    });

    if (dto.assignments?.length) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: dto.assignments.map((a) => a.employeeId) } },
      });
      for (const a of dto.assignments) {
        const user = users.find((u) => u.id === a.employeeId);
        if (user) {
          this.emailService.sendProjectAssignmentEmail(user, {
            projectName: project.name,
            description: project.description,
            role: a.role ?? 'OTHER',
            startDate: project.startDate?.toISOString(),
            deadline: project.expectedEndDate?.toISOString(),
          });
        }
      }
    }

    return project;
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: projectInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    const data: any = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        if (key === 'startDate' || key === 'expectedEndDate') {
          data[key] = new Date(value as string);
        } else {
          data[key] = value;
        }
      }
    }

    return this.prisma.project.update({
      where: { id },
      data,
      include: projectInclude,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Project not found');
    }
    await this.prisma.project.delete({ where: { id } });
  }

  async assignEmployee(projectId: string, dto: AssignEmployeeDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    const user = await this.prisma.user.findUnique({ where: { id: dto.employeeId } });
    if (!user) throw new NotFoundException('User not found');

    try {
      const assignment = await this.prisma.projectAssignment.create({
        data: {
          projectId,
          userId: dto.employeeId,
          role: dto.role ?? 'OTHER',
          workload: dto.workload,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, position: true, skills: true } },
        },
      });

      this.emailService.sendProjectAssignmentEmail(user, {
        projectName: project.name,
        description: project.description,
        role: dto.role ?? 'OTHER',
        startDate: project.startDate?.toISOString(),
        deadline: project.expectedEndDate?.toISOString(),
      });

      return assignment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Employee is already assigned to this project');
      }
      throw error;
    }
  }

  async unassignEmployee(projectId: string, employeeId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    try {
      await this.prisma.projectAssignment.delete({
        where: { userId_projectId: { userId: employeeId, projectId } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Employee is not assigned to this project');
      }
      throw error;
    }
  }

  async getEmployees(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.projectAssignment.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, position: true, skills: true } },
      },
    });
  }

  findMine(userId: string) {
    return this.prisma.project.findMany({
      where: {
        assignments: { some: { userId } },
      },
      include: projectInclude,
    });
  }

  async recommendSkills(description: string) {
    const commonSkills = [
      'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'Go', 'Rust',
      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'SQL', 'MongoDB', 'PostgreSQL',
      'Redis', 'GraphQL', 'REST API', 'TypeScript', 'JavaScript', 'HTML', 'CSS',
      'Next.js', 'NestJS', 'Express', 'Fastify', 'Prisma', 'TypeORM',
      'CI/CD', 'GitHub Actions', 'Jenkins', 'Terraform', 'Ansible',
      'Machine Learning', 'AI', 'LLM', 'NLP', 'Computer Vision',
      'React Native', 'Flutter', 'Swift', 'Kotlin', 'Android',
      'Figma', 'UI/UX', 'Tailwind CSS', 'SASS',
    ];

    const extracted = commonSkills.filter((skill) =>
      description.toLowerCase().includes(skill.toLowerCase()),
    );

    const employees = await this.prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      select: {
        id: true, name: true, email: true, position: true, skills: true,
      },
    });

    const suggested = employees.map((emp) => {
      const empSkills = (emp.skills || '').split(',').map((s) => s.trim().toLowerCase());
      const matchCount = extracted.filter((s) => empSkills.includes(s.toLowerCase())).length;
      return { ...emp, matchCount, matchPercent: extracted.length ? Math.round((matchCount / extracted.length) * 100) : 0 };
    }).sort((a, b) => b.matchCount - a.matchCount);

    return { extractedSkills: extracted, suggestedEmployees: suggested };
  }

  async updateAssignment(projectId: string, employeeId: string, dto: { role?: string; workload?: number; joiningDate?: string }) {
    const data: any = {};
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.workload !== undefined) data.workload = dto.workload;
    if (dto.joiningDate !== undefined) data.joiningDate = new Date(dto.joiningDate);

    return this.prisma.projectAssignment.update({
      where: { userId_projectId: { userId: employeeId, projectId } },
      data,
    });
  }
}
