import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessageGateway } from './message.gateway'; // Path to your MessageGateway file
import { PrismaService } from 'src/prisma/prisma.service'; // Assuming PrismaService is correctly imported
import { MessageStatus } from '@prisma/client'; // Import the MessageStatus enum

@Injectable()
export class MsgService {
  constructor(
    private readonly prisma: PrismaService,
    //private readonly jwtService: JwtService,
    private readonly messageGateway: MessageGateway,
) {}

// Send message to admin from user
async sendMessageToAdmin(userId: string, message: string): Promise<{ success: boolean, message: string, data: any }> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  
  if (!user) {
    throw new Error('User not found');
  }

  if (user.type !== 'clint') {
    return {
      message: 'Only clients can send messages to admin',
      success: false,
      data: null,
    }
  }

  let conversation = await this.prisma.conversation.findFirst({
    where: {
      creator_id: userId,
      participant_id: await this.messageGateway.ADMIN_ID, 
    },
  });

  if (!conversation) {
    conversation = await this.prisma.conversation.create({
      data: {
        creator_id: userId,
        participant_id: await this.messageGateway.ADMIN_ID, 
      },
    });
    console.log('New conversation created: ', conversation.id);
  }

  // Create the message with a PENDING status and link it to the conversation
  const newMessage = await this.prisma.message.create({
    data: {
      sender_id: userId,
      receiver_id: await this.messageGateway.ADMIN_ID,
      message,
      status: MessageStatus.PENDING,
      conversation_id: conversation.id,
    },
  });

  // If the admin is connected, emit the message to the admin
  if (this.messageGateway.adminSocketId) {
    this.messageGateway.server
      .to(this.messageGateway.adminSocketId)
      .emit('message_from_user', {
        userId,
        message,
        messageId: newMessage.id,
        conversationId: conversation.id,
      });

   
    await this.prisma.message.update({
      where: { id: newMessage.id },
      data: { status: MessageStatus.SENT },
    });

    return { success: true, message: 'Message sent to admin', data: newMessage };
  } else {
   
    throw new Error('Admin is not available');
  }
}
// Send message to user from admin
async sendMessageToUser(adminId: string, userId: string, message: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.type !== 'admin') {
        return {
      message: 'Only admins can send messages to users',
      success: false,
      data: null,
    };
  }

    const userSocketId = this.messageGateway.getSocketIdByUserId(userId);

      const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { type: true },
  });

  
  if (user.type !== 'clint') {
    return {
      message: 'He is not a client',
      success: false,
      data: null,
    }
  }

    //socket id
    if (!userSocketId) {
      return{
        message: 'User is not connected',
        success: false,
        data: null,
      };
    }
    let conversation = await this.prisma.conversation.findFirst({
    where: {
      creator_id: userId,
      participant_id: await this.messageGateway.ADMIN_ID, 
    },
  });

  if (!conversation) {
    conversation = await this.prisma.conversation.create({
      data: {
        creator_id: userId,
        participant_id: await this.messageGateway.ADMIN_ID,
      },
    });
    console.log('New conversation created: ', conversation.id);
  }

    
    const newMessage = await this.prisma.message.create({
      data: {
        sender_id: adminId,
        receiver_id: userId,
        message,
        status: MessageStatus.PENDING,
        conversation_id: conversation.id,
      },
    });


    this.messageGateway.server
      .to(userSocketId)
      .emit('message_from_admin', { message, messageId: newMessage.id });

 
    await this.prisma.message.update({
      where: { id: newMessage.id },
      data: { status: MessageStatus.SENT },
    });

    return { success: true, message: `Message sent to user ${userId}`, data: newMessage };
}
// Mark message as delivered
async markMessageAsDelivered(messageId: string) {
    const message = await this.prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.DELIVERED },
    });

    return { success: true, message: 'Message marked as delivered', data: message };
}
// Mark message as read
async markMessageAsRead(messageId: string) {
    const message = await this.prisma.message.update({
      where: { id: messageId },
      data: { status: MessageStatus.READ },
    });

    return { success: true, message: 'Message marked as read', data: message };
}
//get messages using conversation id 
async getMessagesByConversation(conversationId: string) {
  return this.prisma.message.findMany({
    where: { conversation_id: conversationId },
    orderBy: {
      created_at: 'asc', // Order messages by creation date
    },
  });
}
//get all converation
async getAllConversations() {
  try {
    const conversations = await this.prisma.conversation.findMany({
      include: {
        creator: {
          select: {
            id: true, // Select only the specified fields for creator
            created_at: true,
            status: true,
            email: true,
            phone_number: true,
            billing_id: true,
            type: true,
          },
        },
        participant: {
          select: {
            id: true, // Select only the specified fields for participant
            created_at: true,
            status: true,
            email: true,
            phone_number: true,
            billing_id: true,
            type: true,
          },
        },
        messages: true, // Keep all messages
      },
      orderBy: {
        created_at: 'desc', // You can still order the conversations
      },
    });

    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw new Error('Could not fetch conversations');
  }
}
//get one conversation
async getOneConversation(conversationId: string) {
  try {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        creator: {
          select: {
            id: true, // Select only the specified fields for creator
            created_at: true,
            status: true,
            email: true,
            phone_number: true,
            billing_id: true,
            type: true,
          },
        },
        participant: {
          select: {
            id: true, // Select only the specified fields for participant
            created_at: true,
            status: true,
            email: true,
            phone_number: true,
            billing_id: true,
            type: true,
          },
        },
        messages: true, // Include all messages related to the conversation
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    return conversation;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw new Error('Could not fetch the conversation');
  }
}}