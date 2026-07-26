import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionKey } from '../common/constants/permissions';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyOrganization(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        roles: {
          include: { permissions: true }
        }
      }
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async getMembers(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        organizationRole: {
          select: {
            id: true,
            name: true,
            isOwnerRole: true,
          }
        }
      }
    });
  }

  async getRoles(organizationId: string) {
    return this.prisma.organizationRole.findMany({
      where: { organizationId },
      include: {
        permissions: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          }
        },
        _count: {
          select: { users: true }
        }
      }
    });
  }

  async createRole(organizationId: string, name: string, permissions: PermissionKey[]) {
    // Check if role already exists in org
    const existing = await this.prisma.organizationRole.findUnique({
      where: {
        organizationId_name: {
          organizationId,
          name,
        }
      }
    });

    if (existing) {
      throw new ConflictException('A role with this name already exists in your organization.');
    }

    return this.prisma.organizationRole.create({
      data: {
        organizationId,
        name,
        permissions: {
          create: permissions.map(p => ({ permissionKey: p }))
        }
      },
      include: { permissions: true }
    });
  }

  async deleteRole(organizationId: string, roleId: string) {
    const role = await this.prisma.organizationRole.findFirst({
      where: { id: roleId, organizationId }
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isOwnerRole) {
      throw new ConflictException('Cannot delete the Owner role.');
    }

    const usersWithRole = await this.prisma.user.count({
      where: { organizationRoleId: roleId }
    });

    if (usersWithRole > 0) {
      throw new ConflictException('Cannot delete a role that is currently assigned to users. Reassign them first.');
    }

    await this.prisma.organizationRole.delete({
      where: { id: roleId }
    });

    return { message: 'Role deleted successfully' };
  }
}
