import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secretKey', // Fallback for dev
    });
  }

  async validate(payload: any) {
    this.logger.debug(`Validating JWT payload: ${JSON.stringify(payload)}`);
    return {
      userId: payload.sub,
      email: payload.email,
      userType: payload.userType,
    };
  }
}
