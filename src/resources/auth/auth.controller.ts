import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';
import {
  DriverRegisterDto,
  FleetOwnerRegisterDto,
  CustomerRegisterDto,
} from './dto/create-user.dto';
import {
  CustomerRegisterResponse,
  DriverRegisterResponse,
  FleetRegisterResponse,
} from './dto/register-response.dto';

type AuthenticatedRequest = ExpressRequest & {
  user: {
    userId: string;
  };
};

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
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
    @Request() req: ExpressRequest,
  ) {
    // Use device info from middleware
    const deviceInfo = req.deviceInfo || {
      ipAddress: '127.0.0.1',
      userAgent: 'Unknown',
      deviceType: 'Unknown',
    };
    return this.authService.login(body.email, body.password, deviceInfo);
  }

  // ─── Driver Registration (multipart/form-data + file uploads) ──────────────

  @Post('register/driver')
  @ApiOperation({
    summary: 'Register a new driver',
    description:
      'Creates a new driver account. Accepts `multipart/form-data` with optional ' +
      '`licenseFront` and `licenseBack` image files alongside the text fields.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'email',
        'password',
        'firstName',
        'lastName',
        'phoneNumber',
        'licenseNumber',
        'vehicleType',
      ],
      properties: {
        email: { type: 'string', example: 'driver@example.com' },
        password: { type: 'string', example: 'SecurePass123!' },
        firstName: { type: 'string', example: 'Kofi' },
        lastName: { type: 'string', example: 'Adu' },
        phoneNumber: { type: 'string', example: '+233244000002' },
        licenseNumber: { type: 'string', example: 'GH-1234567-89' },
        vehicleType: {
          type: 'string',
          enum: ['TRAILER', 'TIPPER_TRUCK', 'BUS', 'MINING_TRANSPORT', 'OTHER'],
        },
        referralCode: { type: 'string', example: 'REF-ABC123' },
        licenseFront: {
          type: 'string',
          format: 'binary',
          description: 'Front page of driver licence',
        },
        licenseBack: {
          type: 'string',
          format: 'binary',
          description: 'Back page of driver licence',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Driver successfully registered',
    type: DriverRegisterResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or duplicate account',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'licenseFront', maxCount: 1 },
        { name: 'licenseBack', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } },
    ),
  )
  registerDriver(
    @Body() dto: DriverRegisterDto,
    @UploadedFiles()
    files: {
      licenseFront?: Express.Multer.File[];
      licenseBack?: Express.Multer.File[];
    },
  ) {
    return this.authService.registerDriver(dto, files);
  }

  // ─── Fleet Owner Registration ────────────────────────────────────────────────

  @Post('register/fleet-owner')
  @ApiOperation({
    summary: 'Register a new fleet owner',
    description: 'Creates a FLEET_OWNER account. Accepts JSON body.',
  })
  @ApiBody({ type: FleetOwnerRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Fleet owner registered successfully',
    type: FleetRegisterResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or duplicate account',
  })
  registerFleetOwner(@Body() dto: FleetOwnerRegisterDto) {
    return this.authService.registerFleetOwner(dto);
  }

  // ─── Customer Registration ────────────────────────────────────────────────────

  @Post('register/customer')
  @ApiOperation({
    summary: 'Register a new customer',
    description: 'Creates a CUSTOMER account. Accepts JSON body.',
  })
  @ApiBody({ type: CustomerRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Customer registered successfully',
    type: CustomerRegisterResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or duplicate account',
  })
  registerCustomer(@Body() dto: CustomerRegisterDto) {
    return this.authService.registerCustomer(dto);
  }

  @Post('verify-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test endpoint to verify JWT token is valid' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid' })
  verifyToken(@Request() req: AuthenticatedRequest) {
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
    @Request() req: AuthenticatedRequest,
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
  async logoutAll(@Request() req: AuthenticatedRequest) {
    await this.authService.logoutAll(req.user.userId);
    return { message: 'Logged out from all devices successfully' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user active sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions retrieved' })
  async getSessions(@Request() req: AuthenticatedRequest) {
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
