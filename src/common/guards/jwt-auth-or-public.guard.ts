/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthOrPublicGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ✅ 1. Allow WebSocket connections (Socket.IO)
    if (context.getType() === 'ws') {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // ✅ 2. Allow socket.io polling endpoint
    if (request?.url?.startsWith('/socket.io')) {
      return true;
    }

    // ✅ 3. Allow @Public() routes
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    // ✅ 4. Fallback to JWT AuthGuard for REST APIs
    const guard = new (AuthGuard('jwt'))();
    return guard.canActivate(context) as Promise<boolean>;
  }
}
