import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaClient, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const prisma = new PrismaClient();

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return createUserDto;
  }

  findAll() {
    return `This action returns all user`;
  }

  // apply condition on this part
  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  // Find user by email (you mentioned this as a possible condition)
  async findOneByEmail(email: string): Promise<User | null>  {
    const user = await this.prisma.user.findUnique({
      where: { email: email }, 
    });
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
