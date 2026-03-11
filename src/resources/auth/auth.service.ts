/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { DriversService } from '../drivers/drivers.service';
import { FleetOwnersService } from '../fleet-owners/fleet-owners.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserType } from '../users/entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import {
  BaseRegisterDto,
  CustomerRegisterDto,
  DriverRegisterDto,
  FleetOwnerRegisterDto,
} from './dto/create-user.dto';
import { FileUploadService } from '../upload/file-upload.service';

type ValidatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  phoneNumber?: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private dataSource: DataSource,
    private driversService: DriversService,
    private fleetOwnersService: FleetOwnersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private fileUploadService: FileUploadService,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
  ) {}

  async validateUser(email: string, pass: string): Promise<ValidatedUser> {
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
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      phoneNumber: user.phoneNumber,
    };
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
      const payload = this.jwtService.verify<{
        sub: string;
      }>(refreshToken, {
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
    } catch {
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

  private async register(registerDto: BaseRegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const userData = { ...registerDto, password: hashedPassword };

    switch (registerDto.userType) {
      case UserType.DRIVER:
        return this.driverRegistration(userData as DriverRegisterDto);
      case UserType.FLEET_OWNER:
        return this.fleetOwnerRegistration(userData as FleetOwnerRegisterDto);
      case UserType.CUSTOMER:
        return this.customerRegistration(userData as CustomerRegisterDto);
      default:
        throw new BadRequestException('Invalid user type');
    }
  }

  async registerDriver(
    dto: DriverRegisterDto,
    files?: {
      licenseFront?: Express.Multer.File[];
      licenseBack?: Express.Multer.File[];
    },
  ) {
    if (files?.licenseFront?.[0]) {
      const result = await this.fileUploadService.uploadFile(
        files.licenseFront[0],
        { folder: 'truckly/driver/licences' },
      );
      dto.licenseFrontPageUrl = result.secureUrl;
    }

    if (files?.licenseBack?.[0]) {
      const result = await this.fileUploadService.uploadFile(
        files.licenseBack[0],
        { folder: 'truckly/driver/licences' },
      );
      dto.licenseBackPageUrl = result.secureUrl;
    }

    dto.userType = 'DRIVER' as DriverRegisterDto['userType'];
    return this.register(dto);
  }

  async registerFleetOwner(dto: FleetOwnerRegisterDto) {
    dto.userType = 'FLEET_OWNER' as FleetOwnerRegisterDto['userType'];
    return this.register(dto);
  }

  async registerCustomer(dto: CustomerRegisterDto) {
    dto.userType = 'CUSTOMER' as CustomerRegisterDto['userType'];
    return this.register(dto);
  }

  async driverRegistration(registerDto: DriverRegisterDto) {
    if (!registerDto.licenseNumber || !registerDto.vehicleType) {
      throw new BadRequestException(
        'License number and vehicle type are required for driver registration',
      );
    }

    try {
      const driver = await this.dataSource.transaction(async (manager) => {
        const user = await manager.getRepository('User').save({
          email: registerDto.email,
          password: await bcrypt.hash(registerDto.password, 10),
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phoneNumber: registerDto.phoneNumber,
          userType: registerDto.userType,
        });

        const { password: _password, ...userResult } = user;
        void _password;

        const driver = await manager.getRepository('Driver').save({
          userId: user.id,
          licenseNumber: registerDto.licenseNumber,
          vehicleType: registerDto.vehicleType,
          licenseFrontPageUrl: registerDto.licenseFrontPageUrl,
          licenseBackPageUrl: registerDto.licenseBackPageUrl,
          referralCode: registerDto.referralCode,
        });
        this.logger.log('here is the driver', driver);
        return { ...userResult, driver };
      });
      return driver;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Driver registration failed',
      );
    }
  }

  async fleetOwnerRegistration(registerDto: FleetOwnerRegisterDto) {
    if (!registerDto.companyName || !registerDto.registrationNumber) {
      throw new BadRequestException(
        'Company name and registration number are required for fleet owner registration',
      );
    }

    try {
      const fleetOwner = await this.dataSource.transaction(async (manager) => {
        const user = await manager.getRepository('User').save({
          email: registerDto.email,
          password: await bcrypt.hash(registerDto.password, 10),
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phoneNumber: registerDto.phoneNumber,
          userType: registerDto.userType,
        });
        const { password: _password, ...userResult } = user;
        void _password;

        const fleetOwner = await manager.getRepository('FleetOwner').save({
          userId: user.id,
          companyName: registerDto.companyName,
          registrationNumber: registerDto.registrationNumber,
          fleetSize: registerDto.fleetSize,
          operatingRegions: registerDto.operatingRegions,
          monthlyLoads: registerDto.monthlyLoads,
          referralCode: registerDto.referralCode,
        });

        return { ...userResult, fleetOwner };
      });
      return fleetOwner;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Fleet Manager Registration Failed',
      );
    }
  }

  async customerRegistration(registerDto: CustomerRegisterDto) {
    try {
      const customer = await this.dataSource.manager.transaction(
        async (manager) => {
          const user = await manager.getRepository('User').save({
            email: registerDto.email,
            password: await bcrypt.hash(registerDto.password, 10),
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            phoneNumber: registerDto.phoneNumber,
            userType: registerDto.userType,
          });

          const { password: _password, ...userResult } = user;
          void _password;

          return { ...userResult };
        },
      );
      this.logger.log(
        `Customer ${customer.id} registered successfully with email ${customer.email}`,
      );
      return customer;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Customer Registration Failed',
      );
    }
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
