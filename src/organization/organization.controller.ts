import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { PermissionKey } from '../common/constants/permissions';

@Controller('organization')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get('me')
  getMyOrganization(@Request() req: any) {
    return this.orgService.getMyOrganization(req.user.organizationId);
  }

  @Get('members')
  @Permissions('MANAGE_MEMBERS')
  getMembers(@Request() req: any) {
    return this.orgService.getMembers(req.user.organizationId);
  }

  @Get('roles')
  getRoles(@Request() req: any) {
    return this.orgService.getRoles(req.user.organizationId);
  }

  @Post('roles')
  @Permissions('CREATE_ROLES')
  createRole(
    @Request() req: any,
    @Body() body: { name: string; permissions: PermissionKey[] }
  ) {
    return this.orgService.createRole(req.user.organizationId, body.name, body.permissions);
  }

  @Delete('roles/:id')
  @Permissions('CREATE_ROLES')
  deleteRole(@Request() req: any, @Param('id') id: string) {
    return this.orgService.deleteRole(req.user.organizationId, id);
  }
}
