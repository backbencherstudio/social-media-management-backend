import { Injectable } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
import appConfig from '../../../config/app.config';
import { CreateMessageDto } from './dto/create-message.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChatRepository } from '../../../common/repository/chat/chat.repository';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import { DateHelper } from '../../../common/helper/date.helper';
import { MessageGateway } from './message.gateway';
// import { UserRepository } from '../../../common/repository/user/user.repository';
// import { Role } from 'src/common/guard/role/role.enum';

@Injectable()
export class MessageService {
  [x: string]: any;
  constructor(
    private prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
  ) {}
  async create(user_id: string, createMessageDto: CreateMessageDto) {
    try {
      let conversationId = createMessageDto.conversation_id;

      // Step 1: Find or create conversation
      if (!conversationId) {
        const existing = await this.prisma.conversation.findFirst({
          where: {
            OR: [
              {
                creator_id: user_id,
                participant_id: createMessageDto.receiver_id,
              },
              {
                creator_id: createMessageDto.receiver_id,
                participant_id: user_id,
              },
            ],
            deleted_at: null,
          },
        });

        if (existing) {
          conversationId = existing.id;
        } else {
          const created = await this.prisma.conversation.create({
            data: {
              creator_id: user_id,
              participant_id: createMessageDto.receiver_id,
            },
          });
          conversationId = created.id;
        }
      }

      // Step 2: Validate receiver
      const receiver = await this.prisma.user.findFirst({
        where: {
          id: createMessageDto.receiver_id,
        },
      });

      if (!receiver) {
        return {
          success: false,
          message: 'Receiver not found',
        };
      }

      // Step 3: Save message
      const message = await this.prisma.message.create({
        data: {
          // sender_id: user_id,
          // receiver_id: createMessageDto.receiver_id,
          // message: createMessageDto.message,
          // status: MessageStatus.SENT,
          // conversation_id: conversationId,
          // attachment_id: createMessageDto.attachment_id ?? undefined,
          sender_id: user_id,
          receiver_id: createMessageDto.receiver_id,
          message: createMessageDto.message,
          conversation_id: conversationId,
        },
      });

      // Step 4: Update conversation's updated_at
      await this.prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updated_at: DateHelper.now(),
        },
      });

      return {
        success: true,
        data: message,
        message: 'Message sent successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll({
    user_id,
    conversation_id,
    limit = 20,
    cursor,
  }: {
    user_id: string;
    conversation_id: string;
    limit?: number;
    cursor?: string;
  }) {
    try {
      // ===== AUTH CHECK DISABLED =====
      // const userDetails = await UserRepository.getUserDetails(user_id);

      const where_condition: any = {
        AND: [{ id: conversation_id }],
      };

      // Skip role-based filtering for now
      // if (userDetails.type != Role.ADMIN) {
      //   where_condition['OR'] = [
      //     { creator_id: user_id },
      //     { participant_id: user_id },
      //   ];
      // }

      const conversation = await this.prisma.conversation.findFirst({
        where: where_condition,
      });

      if (!conversation) {
        return {
          success: false,
          message: 'Conversation not found',
        };
      }

      const paginationData = {};
      if (limit) {
        paginationData['take'] = limit;
      }
      if (cursor) {
        paginationData['cursor'] = { id: cursor };
        paginationData['skip'] = 1;
      }

      const messages = await this.prisma.message.findMany({
        ...paginationData,
        where: {
          conversation_id: conversation_id,
        },
        orderBy: {
          created_at: 'asc',
        },
        select: {
          id: true,
          message: true,
          created_at: true,
          status: true,
          attachment_id: true,
          sender: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          attachment: {
            select: {
              id: true,
              name: true,
              type: true,
              size: true,
              file: true,
            },
          },
        },
      });

      // Add attachment and avatar URLs
      for (const message of messages) {
        if (message.attachment_id) {
          message.attachment_id['file_url'] = SojebStorage.url(
            appConfig().storageUrl.attachment + message.attachment_id,
          );
        }
        if (message.sender?.avatar) {
          message.sender['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar + message.sender.avatar,
          );
        }
        if (message.receiver?.avatar) {
          message.receiver['avatar_url'] = SojebStorage.url(
            appConfig().storageUrl.avatar + message.receiver.avatar,
          );
        }
      }

      return {
        success: true,
        data: messages,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async updateMessageStatus(message_id: string, status: MessageStatus) {
    return await ChatRepository.updateMessageStatus(message_id, status);
  }

  async readMessage(message_id: string) {
    return await ChatRepository.updateMessageStatus(
      message_id,
      MessageStatus.READ,
    );
  }

  async updateUserStatus(user_id: string, status: string) {
    return await ChatRepository.updateUserStatus(user_id, status);
  }
}
