/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import type AuthUser from 'src/auth/dto/auth-user';
import {
  MENU_ACCESS_KEY,
  type MenuAccessMetadata,
} from 'src/common/decorators/menu-access.decorator';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { MenuPermissionService } from 'src/app-configuration/menu-permission/menu-permission.service';

type RequestWithUser = Request & {
  user?: AuthUser;
};

@Injectable()
export class MenuAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly menuPermissionService: MenuPermissionService,
  ) { }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const access = this.reflector.getAllAndOverride<MenuAccessMetadata | undefined>(
      MENU_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!access) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return false;
    }

    const organizationId = this.getOrganizationId(request);
    const allowed = await this.menuPermissionService.hasCurrentMenuAccess(user, {
      organizationId,
      menuName: access.menuName,
      action: access.action,
    });

    if (!allowed) {
      throw new ForbiddenException('You do not have permission to access this menu action.');
    }

    return true;
  }

  private getOrganizationId(request: RequestWithUser) {
    const headerValue = request.headers?.['x-organization-id'];
    const headerOrganizationId = this.asHeaderString(headerValue);
    // const queryOrganizationId = this.asString(request.query?.organizationId);
    // const bodyOrganizationId = this.asBodyOrganizationId(request.body);

    return headerOrganizationId || undefined /*|| queryOrganizationId || bodyOrganizationId || undefined*/;
  }

  private asHeaderString(value: string | string[] | undefined) {
    const firstValue = Array.isArray(value) ? value[0] : value;
    return this.asString(firstValue);
  }

  private asBodyOrganizationId(body: unknown) {
    if (!body || typeof body !== 'object' || !('organizationId' in body)) {
      return undefined;
    }

    return this.asString(body.organizationId);
  }

  private asString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }
}
