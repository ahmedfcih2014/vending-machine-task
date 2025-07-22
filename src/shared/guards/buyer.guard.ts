import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Role, User } from 'generated/prisma';

@Injectable()
export class BuyerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user: User = request['user'] as User;
    if (!user) {
      throw new UnauthorizedException();
    }
    if (user.role == Role.BUYER) return true;
    throw new ForbiddenException('You are not a buyer');
  }
}
