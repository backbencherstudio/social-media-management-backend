import { Injectable } from '@nestjs/common';
import { CreateResellerDto } from './dto/create-reseller.dto';
import { UpdateResellerDto } from './dto/update-reseller.dto';
import { UserRepository } from 'src/common/repository/user/user.repository';
import { Reseller } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class ResellerService {
    constructor(private readonly prisma: PrismaService) {}
  create(createResellerDto: CreateResellerDto) {
    return 'This action adds a new reseller';
  }

  findOne(id: number) {
    return `This action returns a #${id} reseller`;
  }

  update(id: number, updateResellerDto: UpdateResellerDto) {
    return `This action updates a #${id} reseller`;
  }

  remove(id: number) {
    return `This action removes a #${id} reseller`;
  }


async findAllResellers(p0: { q: string; type: string; approved: string }) {
  try {
    const { q, type, approved } = p0;

    const users = await UserRepository.getAllResellers();
    const resellers = await this.prisma.reseller.findMany({
      where: {
        user: {
          type: "reseller",
        },

      },
      include: {
        user: true,
        reseller_application:true, 
        task_assignments: true,
      },
    });
    
    const data = resellers.map((reseller) => {
     
      const totalEarnings = reseller.task_assignments.reduce(
        (acc, task) => acc + (task.ammount || 0), 
        0,
      );

      const totalTasks = reseller.task_assignments.length;

      return {
        id: reseller.user?.id,
        full_name: reseller.full_name,
        user_email: reseller.user?.email,
        total_earnings: totalEarnings,
        total_task: totalTasks,
        skills:reseller.skills,
        user_type: reseller.user?.type, 
        status: reseller.status, 
      };
    });

    return {
      success: true,
      message: 'Resellers fetched successfully',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
  
}

// ACCEPT AND REJCET A USER TO BECOME A RESELLER 

async handleResellerApplication(id: string, applicationId: string, action: 'accept' | 'reject') {
  try {

    const application = await this.prisma.resellerApplication.findFirst({
      where: {
        applicationId: applicationId,
        user_id: id,                 
      },
    });

    if (!application) {
      return {
        success: false,
        message: 'User application not found',
      };
    }

   
    if (action === 'accept') {
     
      await this.prisma.resellerApplication.update({
        where: { applicationId: applicationId },
        data: { status: 'accepted' },
      });

     
      const updatedUser = await this.prisma.user.update({
        where: { id: application.user_id },
        data: { type: 'reseller' , },
      });

      
      const newReseller = await this.prisma.reseller.create({
        data: {
          id: `ORD_${createId()}`,  
          user_type: 'reseller',
          full_name: application.full_name,
          user_email: application.user_email,
          skills: application.skills || [],
          status: 'active',
          total_task: 0,
          total_earnings: 0,
        },
      });

      return {
        success: true,
        message: 'User successfully upgraded to reseller',
        data: newReseller,
      };
    } else if (action === 'reject') {
      
      await this.prisma.resellerApplication.update({
        where: { applicationId: applicationId },
        data: { status: 'rejected' },
      });

      
      const updatedUser = await this.prisma.user.update({
        where: { id: application.user_id },
        data: { type: 'user' },  
      });

      return {
        success: true,
        message: 'Application has been rejected',
        data: updatedUser,
      };
    } else {
      return {
        success: false,
        message: 'Invalid action',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error handling reseller application: ${error.message}`,
    };
  }
}




}
