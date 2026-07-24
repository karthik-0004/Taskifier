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

function positionToRole(position: string | null | undefined): string {
  if (!position) return 'OTHER';
  const map: Record<string, string> = {
    'Developer': 'BACKEND',
    'Tester': 'QA',
    'Designer': 'UI_UX',
    'DevOps': 'DEVOPS',
    'Product Manager': 'OTHER',
  };
  return map[position] ?? 'OTHER';
}

function diffFields(oldData: any, newData: any): string[] {
  const changes: string[] = [];
  const fields: Array<{ key: string; label: string; format?: (v: any) => string }> = [
    { key: 'name', label: 'Project Name' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'startDate', label: 'Start Date', format: (v) => v ? new Date(v).toLocaleDateString() : 'Not set' },
    { key: 'expectedEndDate', label: 'Expected End Date', format: (v) => v ? new Date(v).toLocaleDateString() : 'Not set' },
  ];
  for (const f of fields) {
    if (newData[f.key] !== undefined && newData[f.key] !== oldData[f.key]) {
      const oldVal = f.format ? f.format(oldData[f.key]) : (oldData[f.key] ?? 'Not set');
      const newVal = f.format ? f.format(newData[f.key]) : newData[f.key];
      changes.push(`${f.label}: ${oldVal} → ${newVal}`);
    }
  }
  return changes;
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

    // Fetch manager info
    const manager = await this.prisma.user.findUnique({ where: { id: managerId } });

    // Auto-assign roles based on employee position if role is not provided
    const assignmentsWithRoles = dto.assignments?.length
      ? await Promise.all(
          dto.assignments.map(async (a) => {
            if (a.role) return a;
            const user = await this.prisma.user.findUnique({ where: { id: a.employeeId } });
            return { ...a, role: positionToRole(user?.position) };
          }),
        )
      : [];

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
        assignments: assignmentsWithRoles.length
          ? {
              create: assignmentsWithRoles.map((a) => ({
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

    if (assignmentsWithRoles.length) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: assignmentsWithRoles.map((a) => a.employeeId) } },
      });
      const teamMemberList = project.assignments.map((a) => ({
        name: a.user.name,
        role: a.role,
      }));
      for (const a of assignmentsWithRoles) {
        const user = users.find((u) => u.id === a.employeeId);
        if (user) {
          this.emailService.sendProjectAssignmentEmail({
            user,
            project: {
              name: project.name,
              code: project.code,
              description: project.description,
              role: a.role ?? 'OTHER',
              startDate: project.startDate?.toISOString(),
              expectedEndDate: project.expectedEndDate?.toISOString(),
              status: project.status,
              priority: project.priority,
              managerName: manager?.name,
              teamMembers: teamMemberList,
            },
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

    const updated = await this.prisma.project.update({
      where: { id },
      data,
      include: projectInclude,
    });

    // Send update notification to all assigned employees if relevant fields changed
    const changes = diffFields(existing, data);
    if (changes.length > 0 && updated.assignments.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: updated.assignments.map((a) => a.userId) } },
      });
      for (const assignment of updated.assignments) {
        const user = users.find((u) => u.id === assignment.userId);
        if (user) {
          this.emailService.sendProjectUpdateEmail({
            user,
            project: {
              name: updated.name,
              code: updated.code,
              changes,
              managerName: updated.manager?.name,
            },
          });
        }
      }
    }

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Project not found');
    }
    await this.prisma.project.delete({ where: { id } });
  }

  async assignEmployee(projectId: string, dto: AssignEmployeeDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { assignments: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    if (!project) throw new NotFoundException('Project not found');

    const user = await this.prisma.user.findUnique({ where: { id: dto.employeeId } });
    if (!user) throw new NotFoundException('User not found');

    // Auto-fill role from position if not provided
    const role = dto.role ?? positionToRole(user.position);

    try {
      const assignment = await this.prisma.projectAssignment.create({
        data: {
          projectId,
          userId: dto.employeeId,
          role,
          workload: dto.workload,
          joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, position: true, skills: true } },
        },
      });

      // Re-fetch project with all assignments for the email
      const fullProject = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: projectInclude,
      });

      const teamMemberList = (fullProject?.assignments ?? []).map((a) => ({
        name: a.user.name,
        role: a.role,
      }));

      const manager = fullProject?.manager;

      this.emailService.sendProjectAssignmentEmail({
        user,
        project: {
          name: project.name,
          code: project.code,
          description: project.description,
          role,
          startDate: project.startDate?.toISOString(),
          expectedEndDate: project.expectedEndDate?.toISOString(),
          status: project.status,
          priority: project.priority,
          managerName: manager?.name,
          teamMembers: teamMemberList,
        },
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
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, code: true },
    });
    if (!project) throw new NotFoundException('Project not found');

    const user = await this.prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, email: true },
    });

    try {
      await this.prisma.projectAssignment.delete({
        where: { userId_projectId: { userId: employeeId, projectId } },
      });

      if (user) {
        this.emailService.sendProjectRemovalEmail({
          user,
          project: { name: project.name, code: project.code },
          reason: 'Your assignment to this project has been ended by the manager.',
        });
      }
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
