import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async create(createMessageDto: CreateMessageDto, senderId: string): Promise<Message> {
    const messageData: any = {
      ...createMessageDto,
      sender_id: new Types.ObjectId(senderId),
      receiver_id: new Types.ObjectId(createMessageDto.receiver_id),
      resident_id: new Types.ObjectId(createMessageDto.resident_id),
      timestamp: new Date(),
      status: 'unread',
    };

    // Chỉ thêm resident_id nếu nó được cung cấp
    if (createMessageDto.resident_id) {
      messageData.resident_id = new Types.ObjectId(createMessageDto.resident_id);
    }

    const message = new this.messageModel(messageData);
    return message.save();
  }

  async findAll(): Promise<Message[]> {
    return this.messageModel
      .find()
      .populate('sender_id', 'full_name email avatar role gender position')
      .populate('receiver_id', 'full_name email avatar role gender position')
      .populate('resident_id', 'full_name gender')
      .sort({ timestamp: -1 })
      .exec();
  }

  async findConversation(userId1: string, userId2: string, residentId?: string): Promise<Message[]> {
    try {
      // Validate input parameters
      if (!userId1 || !userId2) {
        console.error('Invalid userIds provided:', { userId1, userId2 });
        return [];
      }

      const objectIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!objectIdRegex.test(userId1) || !objectIdRegex.test(userId2)) {
        console.error('Invalid ObjectId format:', { userId1, userId2 });
        return [];
      }

      const query: any = {
        $or: [
          {
            sender_id: new Types.ObjectId(userId1),
            receiver_id: new Types.ObjectId(userId2),
          },
          {
            sender_id: new Types.ObjectId(userId2),
            receiver_id: new Types.ObjectId(userId1),
          },
        ],
      };

      if (residentId) {
        query.resident_id = new Types.ObjectId(residentId);
      }

      return this.messageModel
        .find(query)
        .populate('sender_id', 'full_name email avatar role gender position')
        .populate('receiver_id', 'full_name email avatar role gender position')
        .populate('resident_id', 'full_name gender')
        .sort({ timestamp: 1 })
        .exec();
    } catch (err) {
      console.error('Error in findConversation:', err);
      return [];
    }
  }

  async findUserConversations(userId: string): Promise<any[]> {
    // Get all conversations for a user (both sent and received)
    const messages = await this.messageModel
      .find({
        $or: [
          { sender_id: new Types.ObjectId(userId) },
          { receiver_id: new Types.ObjectId(userId) },
        ],
      })
      .populate('sender_id', 'full_name email avatar role gender position')
      .populate('receiver_id', 'full_name email avatar role gender position')
      .populate('resident_id', 'full_name gender')
      .sort({ timestamp: -1 })
      .exec();

    // Group messages by conversation partner
    const conversations = new Map();
    
    messages.forEach(message => {
      const senderId = message.sender_id._id.toString();
      const receiverId = message.receiver_id._id.toString();
      
      // Determine conversation partner
      const partnerId = senderId === userId ? receiverId : senderId;
      const partner = senderId === userId ? message.receiver_id : message.sender_id;
      
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          partnerId,
          partner: {
            _id: (partner as any)._id || partner,
            full_name: (partner as any).full_name || 'Unknown',
            email: (partner as any).email || '',
            avatar: (partner as any).avatar || '',
            role: (partner as any).role || 'unknown',
            gender: (partner as any).gender || 'unknown',
            position: (partner as any).position || '',
          },
          lastMessage: message,
          unreadCount: 0,
          resident: {
            _id: (message.resident_id as any)?._id || message.resident_id,
            full_name: (message.resident_id as any)?.full_name || 'Unknown',
            gender: (message.resident_id as any)?.gender || 'unknown',
          },
        });
      }
      
      // Count unread messages
      const receiverIdStr = (message.receiver_id as any)._id?.toString() || message.receiver_id.toString();
      if (receiverIdStr === userId && message.status === 'unread') {
        conversations.get(partnerId).unreadCount++;
      }
    });

    return Array.from(conversations.values());
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messageModel
      .findById(id)
      .populate('sender_id', 'full_name email avatar role gender position')
      .populate('receiver_id', 'full_name email avatar role gender position')
      .populate('resident_id', 'full_name gender')
      .exec();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async markAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only mark as read if the user is the receiver
    if (message.receiver_id.toString() !== userId) {
      throw new BadRequestException('You can only mark messages you received as read');
    }

    message.status = 'read';
    return message.save();
  }

  async markConversationAsRead(userId1: string, userId2: string): Promise<void> {
    await this.messageModel.updateMany(
      {
        sender_id: new Types.ObjectId(userId2),
        receiver_id: new Types.ObjectId(userId1),
        status: 'unread',
      },
      { status: 'read' }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageModel
      .countDocuments({
        receiver_id: new Types.ObjectId(userId),
        status: 'unread',
      })
      .exec();
  }

  async remove(id: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(id);
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only allow sender to delete their own message
    if (message.sender_id.toString() !== userId) {
      throw new BadRequestException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndDelete(id);
  }
}
