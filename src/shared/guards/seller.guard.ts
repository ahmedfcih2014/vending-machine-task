import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Role, User } from 'generated/prisma';

@Injectable()
export class SellerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user: User = request['user'] as User;
    if (!user) {
      throw new UnauthorizedException();
    }
    return user.role == Role.SELLER;
  }
}
