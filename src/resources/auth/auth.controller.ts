/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiHeader,
  ApiExtraModels,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Authentication')
@ApiExtraModels(RegisterUserDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: { email: string; password: string },
    @Request() req,
  ) {
    // Use device info from middleware
    const deviceInfo = req.deviceInfo || {
      ipAddress: '127.0.0.1',
      userAgent: 'Unknown',
      deviceType: 'Unknown',
    };
    return this.authService.login(body.email, body.password, deviceInfo);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account. The `userType` field determines which additional fields are required:\n\n' +
      '- **CUSTOMER** — base fields only\n' +
      '- **DRIVER** — base fields + `licenseNumber`, `vehicleType` (and optional `referralCode`)\n' +
      '- **FLEET_OWNER** — base fields + `companyName`, `registrationNumber` (and optional `fleetSize`, `operatingRegions`, `monthlyLoads`)',
  })
  @ApiBody({
    schema: {
      oneOf: [
        {
          title: 'Customer Registration',
          type: 'object',
          properties: {
            userType: { type: 'string', enum: ['CUSTOMER'] },
            email: { type: 'string', example: 'ada.mensah@example.com' },
            password: { type: 'string', example: 'SecurePass123!' },
            firstName: { type: 'string', example: 'Ada' },
            lastName: { type: 'string', example: 'Mensah' },
            phoneNumber: { type: 'string', example: '+233244000001' },
          },
          required: ['userType', 'email', 'password', 'firstName', 'lastName', 'phoneNumber'],
        },
        {
          title: 'Driver Registration',
          type: 'object',
          properties: {
            userType: { type: 'string', enum: ['DRIVER'] },
            email: { type: 'string', example: 'kofi.adu@example.com' },
            password: { type: 'string', example: 'SecurePass123!' },
            firstName: { type: 'string', example: 'Kofi' },
            lastName: { type: 'string', example: 'Adu' },
            phoneNumber: { type: 'string', example: '+233244000002' },
            licenseNumber: { type: 'string', example: 'GH-1234567-89' },
            vehicleType: { type: 'string', enum: ['TRAILER', 'TIPPER_TRUCK', 'BUS', 'MINING_TRANSPORT', 'OTHER'], example: 'TRAILER' },
            referralCode: { type: 'string', example: 'REF-ABC123' },
          },
          required: ['userType', 'email', 'password', 'firstName', 'lastName', 'phoneNumber', 'licenseNumber', 'vehicleType'],
        },
        {
          title: 'Fleet Owner Registration',
          type: 'object',
          properties: {
            userType: { type: 'string', enum: ['FLEET_OWNER'] },
            email: { type: 'string', example: 'ama.owusu@example.com' },
            password: { type: 'string', example: 'SecurePass123!' },
            firstName: { type: 'string', example: 'Ama' },
            lastName: { type: 'string', example: 'Owusu' },
            phoneNumber: { type: 'string', example: '+233244000003' },
            companyName: { type: 'string', example: 'Accra Haulage Ltd' },
            registrationNumber: { type: 'string', example: 'REG-2024-001' },
            fleetSize: { type: 'string', example: '10' },
            operatingRegions: { type: 'array', items: { type: 'string' }, example: ['Greater Accra', 'Ashanti'] },
            monthlyLoads: { type: 'string', example: '20+' },
          },
          required: ['userType', 'email', 'password', 'firstName', 'lastName', 'phoneNumber', 'companyName', 'registrationNumber'],
        },
      ],
    },
  })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate account' })
  async register(@Body() registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test endpoint to verify JWT token is valid' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid' })
  async verifyToken(@Request() req) {
    return {
      message: 'Token is valid',
      user: req.user,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password (requires current password)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password by email (no old password required)',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.newPassword,
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New access token generated' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user (revoke refresh token)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.logout(refreshTokenDto.refresh_token);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  async logoutAll(@Request() req) {
    await this.authService.logoutAll(req.user.userId);
    return { message: 'Logged out from all devices successfully' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user active sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions retrieved' })
  async getSessions(@Request() req) {
    const sessions = await this.authService.getUserActiveSessions(
      req.user.userId,
    );
    return {
      sessions: sessions.map((session) => ({
        id: session.id,
        deviceType: session.deviceType,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        lastUsedAt: session.lastUsedAt,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      })),
    };
  }
}
