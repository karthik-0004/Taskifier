import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../auth/password.service';
import { EmailService } from '../email/email.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Role } from '@prisma/client';

const userSelect = {
  id: true,
  email: true,
  name: true,
  phoneNumber: true,
  position: true,
  profilePicture: true,
  role: true,
  githubUsername: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
  ) {}

  private async generateUniqueConnectionKey(): Promise<string> {
    const randomSegment = () => Math.random().toString(36).substring(2, 6).toUpperCase().padStart(4, '0');
    let key = `TKF-${randomSegment()}-${randomSegment()}`;
    let unique = false;
    while (!unique) {
      const exists = await this.prisma.user.findUnique({ where: { connectionKey: key } });
      if (!exists) {
        unique = true;
      } else {
        key = `TKF-${randomSegment()}-${randomSegment()}`;
      }
    }
    return key;
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await this.passwordService.hash(dto.password);
    const connectionKey = await this.generateUniqueConnectionKey();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        position: dto.position,
        role: Role.EMPLOYEE,
        githubUsername: dto.githubUsername,
        connectionKey,
      },
      select: userSelect,
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name, dto.password);

    return user;
  }

  findAll() {
    return this.prisma.user.findMany({
      where: { role: Role.EMPLOYEE },
      select: userSelect,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getConnectionKey(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { connectionKey: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const data: any = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.githubUsername !== undefined) data.githubUsername = dto.githubUsername;
    if (dto.password) {
      data.passwordHash = await this.passwordService.hash(dto.password);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  async updateProfile(id: string, dto: { name?: string; phoneNumber?: string; position?: string; profilePicture?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.profilePicture !== undefined) data.profilePicture = dto.profilePicture;

    return this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
  }
}
