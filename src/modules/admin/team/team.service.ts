import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Team } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { ResellerStatus } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService, private mailService: MailService) { }
  create(_createTeamDto: CreateTeamDto) {
    return 'This action adds a new team';
  }
  // async addMember(dto: CreateTeamDto) {
  //   try {

  //     const existingMember = await this.prisma.team.findUnique({
  //       where: {
  //         email: dto.email,
  //       },
  //     });

  //     if (existingMember) {
  //      return {
  //        message:'Email already exists'
  //      }
  //     }

  //     const member = await this.prisma.team.create({
  //       data: {
  //         id: `admin_${createId()}`,  
  //         full_name: dto.fullName,
  //         email: dto.email,
  //         role: dto.role,
  //       },
  //     });

  //       await this.mailService.confirmAdminMail({
  //       email: dto.email,
  //       name: dto.fullName,
  //       password: password,
  //     });

  //     return member;

  //   } catch (error) {
  //     console.error('Error in addMember:', error.message);
  //     throw new Error(`Failed to add member: ${error.message}`);
  //   }
  // }

  async addMember(dto: CreateTeamDto) {
    try {
      const existingMember = await this.prisma.team.findUnique({
        where: {
          email: dto.email,
        },
      });

      if (existingMember) {
        return {
          message: 'Email already exists',
        };
      }


      const rawPassword = randomBytes(6).toString('base64');
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const member = await this.prisma.team.create({
        data: {
          id: `admin_${createId()}`,
          full_name: dto.fullName,
          email: dto.email,
          role: dto.role,
          password: hashedPassword,
        },
      });


      await this.mailService.confirmAdminMail({
        email: dto.email,
        name: dto.fullName,
        password: rawPassword,
      });

      return member;

    } catch (error) {
      console.error('Error in addMember:', error.message);
      throw new Error(`Failed to add member: ${error.message}`);
    }
  }



  async updateMember(id: string, dto: UpdateTeamDto) {
    return this.prisma.team.update({
      where: { id },
      data: {
        full_name: dto.fullName,
        role: dto.role,
      },
    });
  }
  async deleteMember(id: string) {
    if (!id) {
      return {
        message: 'User ID is required',
      };
    }

    try {
      await this.prisma.team.delete({
        where: { id },
      });

      return { message: 'Member deleted successfully' };
    } catch (error) {
      return {
        message: 'User not found or could not be deleted',
      };
    }
  }
  async getAllMembers() {
    const list = await this.prisma.team.findMany()

    return {
      message: "success",
      data: list

    }
      ;
  }

}
