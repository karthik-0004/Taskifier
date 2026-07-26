import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionKey } from '../constants/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.permissionKeys) {
      throw new ForbiddenException('You do not have the required permissions.');
    }

    const hasPermission = requiredPermissions.every(permission => user.permissionKeys.includes(permission));

    if (!hasPermission) {
      throw new ForbiddenException('You do not have the required permissions.');
    }

    return true;
  }
}
