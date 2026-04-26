import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type AuthUser from 'src/auth/dto/auth-user';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { RegisterFirebaseTokenDto } from './dto/register-firebase-token.dto';
import { RemoveFirebaseTokenDto } from './dto/remove-firebase-token.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Roles(RolesEnum.admin, RolesEnum.user)
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  async findMine(@CurrentUser() user: AuthUser, @Query() query: NotificationQueryDto) {
    const result = await this.notificationsService.findForUser(user.userId, query.page, query.limit);
    return new BaseResponseDto(result, 'Notifications retrieved successfully');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  async markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const result = await this.notificationsService.markAsRead(user.userId, id);
    return new BaseResponseDto(result, 'Notification marked as read');
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all current user notifications as read' })
  async markAllAsRead(@CurrentUser() user: AuthUser) {
    const result = await this.notificationsService.markAllAsRead(user.userId);
    return new BaseResponseDto(result, 'All notifications marked as read');
  }

  @Post('firebase-token')
  @ApiOperation({ summary: 'Register current browser Firebase token' })
  async registerFirebaseToken(
    @CurrentUser() user: AuthUser,
    @Body() dto: RegisterFirebaseTokenDto,
  ) {
    const result = await this.notificationsService.registerFirebaseToken(user.userId, dto);
    return new BaseResponseDto(result, 'Firebase token registered successfully');
  }

  @Delete('firebase-token')
  @ApiOperation({ summary: 'Remove current browser Firebase token' })
  async removeFirebaseToken(@CurrentUser() user: AuthUser, @Body() dto: RemoveFirebaseTokenDto) {
    const result = await this.notificationsService.removeFirebaseToken(user.userId, dto.token);
    return new BaseResponseDto(result, 'Firebase token removed successfully');
  }
}
