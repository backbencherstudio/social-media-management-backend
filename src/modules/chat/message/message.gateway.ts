import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessageGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  public users: Record<string, string> = {}; // socketId -> userId
  public adminSocketId: string | null = null;
  public readonly adminId =   this.prisma.user.findFirst({
    where: { type: 'admin' },
    select: { id: true },
  }).then(user => user?.id || null).catch(() => {
    console.error('Failed to fetch admin ID');
    return null;
  });
  public readonly ADMIN_ID = this.adminId;
  constructor(private readonly prisma: PrismaService) {}
  async afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }
  async handleConnection(socket: Socket) {
    console.log(`Client connected: ${socket.id}`);
  }
  async handleDisconnect(socket: Socket) {
    console.log(`Client disconnected: ${socket.id}`);
    const userId = this.users[socket.id];

    if (userId) {
      delete this.users[socket.id];
      console.log(`User ${userId} disconnected`);

      // Notify admin if a user disconnected
      if (userId !== await this.ADMIN_ID && this.adminSocketId) {
        this.server.to(this.adminSocketId).emit('user_disconnected', userId);
      }
    }

    if (socket.id === this.adminSocketId) {
      this.adminSocketId = null;
      console.log('Admin disconnected');
    }
  }
  @SubscribeMessage('register_admin')
  async handleAdminRegister(socket: Socket, adminId: string) {
    console.log(`Admin registration attempt: ${adminId}`);
    
    try {
      if (adminId !== await this.ADMIN_ID) {
        socket.emit('registration_error', 'Invalid admin credentials');
        return;
      }

      const existingAdmin = await this.prisma.user.findUnique({
        where: { id: adminId, type: 'admin' },
      });

      if (!existingAdmin) {
        socket.emit('registration_error', 'Admin not found');
        return;
      }

      // Register admin
      this.adminSocketId = socket.id;
      this.users[socket.id] = adminId;
      
      socket.emit('admin_registered', {
        success: true,
        message: 'Admin successfully registered'
      });
      
      console.log(`Admin ${adminId} registered with socket ID: ${socket.id}`);

    } catch (error) {
      console.error(`Admin registration error: ${error.message}`);
      socket.emit('registration_error', 'Admin registration failed');
    }
  }
  @SubscribeMessage('register_user')
  async handleUserRegister(socket: Socket, userId: string) {
    console.log(`User registration attempt: ${userId}`);
    
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        socket.emit('registration_error', 'User not found');
        return;
      }

      if (existingUser.type === 'admin') {
        socket.emit('registration_error', 'Admins must use /register_admin');
        return;
      }

      // Register user
      this.users[socket.id] = userId;
      
      socket.emit('user_registered', {
        success: true,
        userId: existingUser.id,
        conversationId: 'default-conversation-id'
      });
      
      console.log(`User ${userId} registered with socket ID: ${socket.id}`);

      // Notify admin if connected
      if (this.adminSocketId) {
        this.server.to(this.adminSocketId).emit('new_conversation', {
          userId: existingUser.id,
          socketId: socket.id
        });
      }

    } catch (error) {
      console.error(`User registration error: ${error.message}`);
      socket.emit('registration_error', 'User registration failed');
    }
  }
  @SubscribeMessage('message_to_admin')
  async handleMessageToAdmin(socket: Socket, message: string) {
    const userId = this.users[socket.id];

    if (!userId) {
      socket.emit('error', 'User not registered.');
      return;
    }

    if (!this.adminSocketId) {
      socket.emit('error', 'Admin is not available.');
      return;
    }

    this.server.to(this.adminSocketId).emit('message_from_user', {
      userId,
      message,
      socketId: socket.id
    });

    console.log(`Message from ${userId} to admin: ${message}`);
  }
  @SubscribeMessage('message_to_user')
  async handleMessageToUser(socket: Socket, data: { userId: string; message: string }) {
    // Verify sender is admin
    if (this.users[socket.id] !== await this.ADMIN_ID) {
      socket.emit('error', 'Only admin can send messages to users.');
      return;
    }

    const userSocketId = this.getSocketIdByUserId(data.userId);

    if (!userSocketId) {
      socket.emit('error', `User ${data.userId} not online.`);
      return;
    }

    this.server.to(userSocketId).emit('message_from_admin', {
      message: data.message,
      timestamp: new Date().toISOString()
    });

    console.log(`Message from admin to ${data.userId}: ${data.message}`);
  }
  public getSocketIdByUserId(userId: string): string | undefined {
    return Object.keys(this.users).find(socketId => this.users[socketId] === userId);
  }
}