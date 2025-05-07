import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Socket } from 'socket.io';
  import { MessageService } from './message.service';
  import { CreateMessageDto } from './dto/create-message.dto';
  import { PrismaService } from 'src/prisma/prisma.service';
  
  @WebSocketGateway({ cors: true })
  export class MessageGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private clients = new Map<string, Socket>();
  
    constructor(
      private readonly messageService: MessageService,
      private readonly prisma: PrismaService,
    ) {}
  
    handleConnection(client: Socket) {
      console.log('Client connected:', client.id);
    }
  
    handleDisconnect(client: Socket) {
      for (const [userId, socket] of this.clients.entries()) {
        if (socket.id === client.id) {
          this.clients.delete(userId);
          break;
        }
      }
      console.log('Client disconnected:', client.id);
    }
  
    @SubscribeMessage('register')
    handleRegister(@MessageBody() data: { userId: string }, @ConnectedSocket() client: Socket) {
      this.clients.set(data.userId, client);
      console.log(`User registered: ${data.userId}`);
    }
  
    @SubscribeMessage('sendMessage')
    async handleSendMessage(
      @MessageBody() data: CreateMessageDto,
      @ConnectedSocket() client: Socket,
    ) {
      const { senderId, receiverId } = data;
  
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        include: { role_users: { include: { role: true } } },
      });
  
      const senderRoles = sender?.role_users.map(r => r.role?.title?.toLowerCase()) || [];
      const isSenderAdmin = senderRoles.includes('admin');
  
      let actualReceiverId = receiverId;
  
      if (!isSenderAdmin) {
        const admin = await this.prisma.user.findFirst({
          where: {
            role_users: { some: { role: { title: 'admin' } } },
          },
        });
  
        if (!admin) return client.emit('error', 'No admin available');
        actualReceiverId = admin.id;
  
        if (receiverId && receiverId !== admin.id) {
          return client.emit('error', 'Users can only message support.');
        }
      }
  
      const savedMessage = await this.messageService.createMessage({
        ...data,
        receiverId: actualReceiverId,
      });
  
      const receiverSocket = this.clients.get(actualReceiverId);
      if (receiverSocket) {
        receiverSocket.emit('receiveMessage', savedMessage);
      }
  
      client.emit('messageSent', savedMessage);
    }
  }
  