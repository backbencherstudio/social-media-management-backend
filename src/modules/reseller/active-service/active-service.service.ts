import { Injectable } from '@nestjs/common';
import { CreateActiveServiceDto } from './dto/create-active-service.dto';
import { UpdateActiveServiceDto } from './dto/update-active-service.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ActiveServiceService {
  constructor(private readonly prisma: PrismaService) {}

  create(createActiveServiceDto: CreateActiveServiceDto) {
    return 'This action adds a new activeService';
  }

  async findAll() {
    try {
      const services = await this.prisma.service.findMany({
        where: {
          status: 1, // active
        },
        include: {
          user: true,
          category: true,
        },
      });
      return { success: true, data: services };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async findOne(id: string) {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id },
        include: {
          user: true,
          category: true,
        },
      });

      if (!service) {
        return { success: false, message: 'Service not found' };
      }

      return { success: true, data: service };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  update(id: number, updateActiveServiceDto: UpdateActiveServiceDto) {
    return `This action updates a #${id} activeService`;
  }

  remove(id: number) {
    return `This action removes a #${id} activeService`;
  }
}
