import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { IMessage } from './schemas/message.schema';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  async create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    const senderId = req.user.userId || req.user.sub;
    const message = await this.messagesService.create(createMessageDto, senderId);
    
    // Populate the message before returning
    return this.messagesService.findOne((message as unknown as IMessage).id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Get all messages (admin only)' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully.' })
  async findAll() {
    return this.messagesService.findAll();
  }

  @Get('conversations')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully.' })
  async getUserConversations(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.messagesService.findUserConversations(userId);
  }

  @Get('conversation/:partnerId')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Get conversation with specific user' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully.' })
  async getConversation(
    @Param('partnerId') partnerId: string,
    @Request() req,
    @Query('residentId') residentId?: string,
  ) {
    const userId = req.user.userId || req.user.sub;
    const messages = await this.messagesService.findConversation(userId, partnerId, residentId);
    
    // Mark messages as read when conversation is opened
    if (messages.length > 0) {
      await this.messagesService.markConversationAsRead(userId, partnerId);
    }
    
    return messages;
  }

  @Get('unread-count')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully.' })
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    const count = await this.messagesService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Get message by ID' })
  @ApiResponse({ status: 200, description: 'Message retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  async findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Post(':id/read')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Mark message as read' })
  @ApiResponse({ status: 200, description: 'Message marked as read.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  async markAsRead(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.messagesService.markAsRead(id, userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.STAFF, Role.FAMILY)
  @ApiOperation({ summary: 'Delete message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Message not found.' })
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId || req.user.sub;
    await this.messagesService.remove(id, userId);
    return { message: 'Message deleted successfully' };
  }
}

