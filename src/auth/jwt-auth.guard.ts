import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    this.logger.debug(`Auth header: ${authHeader ? 'Present' : 'Missing'}`);

    if (!authHeader) {
      this.logger.warn('No Authorization header found');
      throw new UnauthorizedException('No authorization token provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      this.logger.warn('Authorization header does not start with Bearer');
      throw new UnauthorizedException(
        'Invalid authorization format. Use: Bearer <token>',
      );
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (info) {
      this.logger.error(`JWT validation error: ${info.message}`);
    }

    if (err || !user) {
      this.logger.error(
        `Authentication failed: ${err?.message || 'User not found'}`,
      );
      throw err || new UnauthorizedException('Invalid or expired token');
    }

    return user;
  }
}
