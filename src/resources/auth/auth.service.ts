/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserSession } from './entities/user-session.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User Not Found');
    }

    if (!user.password) {
      throw new UnauthorizedException('User Not Found');
    }

    const isMatch = await bcrypt.compare(pass, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Return user without password if validation succeeds
    const { password, ...result } = user;
    return result;
  }

  async login(
    email: string,
    password: string,
    deviceInfo?: {
      ipAddress?: string;
      userAgent?: string;
      deviceType?: string;
    },
  ) {
    // Validate credentials
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const user = await this.validateUser(email, password);

    const payload = {
      email: user.email,
      sub: user.id,
      userType: user.userType,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '60m', // 1 hour access token
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'refreshSecretKey',
      expiresIn: '7d', // Long-lived refresh token
    });

    // Calculate expiration date for refresh token
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days

    // Store session in database (only refresh token, not access token)
    await this.createSession(
      user.id,
      refreshToken,
      refreshTokenExpiresAt,
      deviceInfo?.ipAddress,
      deviceInfo?.userAgent,
      deviceInfo?.deviceType,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600, // 60 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        phoneNumber: user.phoneNumber,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'refreshSecretKey',
      });

      // Check if session exists and is active
      const session = await this.userSessionRepository.findOne({
        where: { refreshToken, isActive: true },
      });

      if (!session) {
        throw new UnauthorizedException('Invalid or revoked session');
      }

      // Check if session is expired
      if (session.refreshTokenExpiresAt < new Date()) {
        await this.revokeSession(session.id, 'token_expired');
        throw new UnauthorizedException('Session expired');
      }

      // Get fresh user data
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const newPayload = {
        email: user.email,
        sub: user.id,
        userType: user.userType,
      };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '60m',
      });

      // Update session last used time (no need to store access token)
      await this.userSessionRepository.update(session.id, {
        lastUsedAt: new Date(),
      });

      return {
        access_token: newAccessToken,
        expires_in: 3600, // 60 minutes in seconds
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async createSession(
    userId: string,
    refreshToken: string,
    refreshTokenExpiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
    deviceType?: string,
  ): Promise<UserSession> {
    const session = this.userSessionRepository.create({
      userId,
      refreshToken,
      refreshTokenExpiresAt,
      ipAddress,
      userAgent,
      deviceType,
      lastUsedAt: new Date(),
    });

    return this.userSessionRepository.save(session);
  }

  async revokeSession(sessionId: string, reason?: string): Promise<void> {
    await this.userSessionRepository.update(sessionId, {
      isActive: false,
      revokedAt: new Date(),
      revokeReason: reason || 'manual_logout',
    });
  }

  async revokeSessionByRefreshToken(
    refreshToken: string,
    reason?: string,
  ): Promise<void> {
    await this.userSessionRepository.update(
      { refreshToken },
      {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason || 'manual_logout',
      },
    );
  }

  async revokeAllUserSessions(userId: string, reason?: string): Promise<void> {
    await this.userSessionRepository.update(
      { userId, isActive: true },
      {
        isActive: false,
        revokedAt: new Date(),
        revokeReason: reason || 'logout_all',
      },
    );
  }

  // Cleanup method kept for backwards compatibility and manual cleanup
  // The main cleanup is now handled by the cron job
  async cleanupExpiredSessions(userId?: string): Promise<void> {
    const query = this.userSessionRepository
      .createQueryBuilder()
      .delete()
      .where('refresh_token_expires_at < :now', { now: new Date() });

    if (userId) {
      query.andWhere('user_id = :userId', { userId });
    }

    await query.execute();
  }

  async getUserActiveSessions(userId: string): Promise<UserSession[]> {
    return this.userSessionRepository.find({
      where: {
        userId,
        isActive: true,
      },
      order: { lastUsedAt: 'DESC' },
      select: [
        'id',
        'deviceType',
        'ipAddress',
        'createdAt',
        'lastUsedAt',
        'refreshTokenExpiresAt',
      ],
    });
  }

  async logout(refreshToken: string): Promise<void> {
    await this.revokeSessionByRefreshToken(refreshToken, 'manual_logout');
  }

  async logoutAll(userId: string): Promise<void> {
    await this.revokeAllUserSessions(userId, 'logout_all_devices');
  }

  async logoutSession(sessionId: string): Promise<void> {
    await this.revokeSession(sessionId, 'manual_logout');
  }

  async register(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const { password, ...result } = user;
    return result;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    // Get user with password
    const user = await this.usersService.findOneWithPassword(userId);

    if (!user || !user.password) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashedNewPassword);

    // Revoke all sessions to force re-login with new password
    await this.revokeAllUserSessions(userId, 'password_change');

    return { message: 'Password changed successfully. Please login again.' };
  }

  async resetPassword(email: string, newPassword: string) {
    // Find user by email
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedNewPassword);

    // Revoke all sessions to force re-login with new password
    await this.revokeAllUserSessions(user.id, 'password_reset');

    return {
      message: 'Password reset successfully. Please login with new password.',
    };
  }
}
