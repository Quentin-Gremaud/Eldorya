import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ClerkTokenVerifierService } from './clerk-token-verifier.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

interface RequestWithUser extends Request {
  userId?: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tokenVerifier: ClerkTokenVerifierService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization scheme');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const payload = await this.tokenVerifier.verify(token);
      request.userId = payload.sub;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const errMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);
      this.logger.warn(`JWT verification failed: ${errMessage}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
