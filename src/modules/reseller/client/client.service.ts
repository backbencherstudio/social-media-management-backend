import { Injectable } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}
  create(createClientDto: CreateClientDto) {
    return 'This action adds a new client';
  }

  async findAll(resellerId: string) {
    try {
      const tasks = await this.prisma.taskAssign.findMany({
        where: {
          assignees: {
            some: {
              reseller_id: resellerId,
            },
          },
        },
        include: {
          user: true,
        },
      });
    
      const clients = tasks
        .map((task) => task.user)
        .filter((user) => user !== null);

      return {
        success: true,
        data: clients,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch clients.',
      };
    }
  }

  async findOne(resellerId: string, userId: string) {
    try {
      const task = await this.prisma.taskAssign.findFirst({
        where: {
          assignees: {
            some: {
              reseller_id: resellerId,
            },
          },
          user_id: userId,
        },
        include: {
          user: true,
        },
      });

      if (!task || !task.user) {
        return {
          success: false,
          message: 'Client not found for this reseller.',
        };
      }

      return {
        success: true,
        data: task.user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch client.',
      };
    }
  }

  update(id: number, updateClientDto: UpdateClientDto) {
    return `This action updates a #${id} client`;
  }

  remove(id: number) {
    return `This action removes a #${id} client`;
  }
}
