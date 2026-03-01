import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserType } from '../users/entities/user.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  @ApiOperation({
    summary: 'Register or update FCM token for push notifications',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['fcmToken'],
      properties: {
        fcmToken: {
          type: 'string',
          description: 'Firebase Cloud Messaging token',
          example: 'fGHY7j8kL9mN...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'FCM token registered successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async registerToken(@Request() req, @Body('fcmToken') fcmToken: string) {
    const userId = req.user.userId;
    const userRole = req.user.userType;

    // Register token based on user role
    if (userRole === UserType.DRIVER) {
      // For drivers, we need to get their driver profile ID
      // This should be handled via the drivers endpoint instead
      return {
        message:
          'Drivers should use PATCH /drivers/me/fcm-token to register tokens',
        redirectTo: '/drivers/me/fcm-token',
      };
    } else {
      // For customers and other users
      await this.notificationsService.registerUserToken(userId, fcmToken);
      return { message: 'FCM token registered successfully' };
    }
  }

  @Delete('unregister-token')
  @ApiOperation({ summary: 'Clear FCM token (e.g., on logout)' })
  @ApiResponse({ status: 200, description: 'FCM token cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearToken(@Request() req) {
    const userId = req.user.userId;
    const userRole = req.user.userType;

    if (userRole === UserType.DRIVER) {
      return {
        message:
          'Drivers should manage tokens via /drivers/me/fcm-token endpoint',
        redirectTo: '/drivers/me/fcm-token',
      };
    } else {
      await this.notificationsService.clearUserToken(userId);
      return { message: 'FCM token cleared successfully' };
    }
  }
}
