import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateResellerDto } from './dto/create-reseller.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { createId } from '@paralleldrive/cuid2';
import { MailService } from 'src/mail/mail.service';
import { ResellerStatus } from '@prisma/client';

@Injectable()
export class ResellerService {
    constructor(private readonly prisma: PrismaService , private mailService: MailService) {}

  create(createResellerDto: CreateResellerDto) {
    return 'This action adds a new reseller';
  }
  // find all resellers 
async findAllResellers() {
  try {
    const resellers = await this.prisma.reseller.findMany({
      include: {
        user: true,
        reseller_application: true,
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
        id: reseller.id,
        full_name: reseller.full_name,
        user_email: reseller.user_email,
        total_earnings: totalEarnings,
        total_task: totalTasks,
        skills: reseller.skills,
        user_type: reseller.user_type,
        status: reseller.status, 
      };
    });

    return {
      success: true,
      message: 'Resellers fetched successfully',
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error fetching resellers: ${error.message}`,
    };
  }
}
// accept or reject as a reseller 
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
          id: `RES_${createId()}`,  
          user_type: 'reseller',
          full_name: application.full_name,
          user_email: application.user_email,
          skills: application.skills || [],
          status: 'active',
          total_task: 0,
          total_earnings: 0,
        },
      });

      await this.mailService.applicationAcceptedEmail({
        email: application.user_email,
        name: application.full_name ,
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


      await this.mailService.applicationRejectedEmail({
        email: application.user_email,
        name: application.full_name ,
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
// get all applications
async getAllApplication() {
  try {
    const applications = await this.prisma.resellerApplication.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
      success: true,
      message: 'Fetched all reseller applications successfully.',
      data: applications,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error fetching reseller applications: ${error.message}`,
    };
  }
}
//view one application
async getOneApplication(applicationId:string) {
  try {
    const applications = await this.prisma.resellerApplication.findMany({
      where:{
        applicationId:applicationId,
      }
    });

    return {
      success: true,
      message: 'success',
      data: applications,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error fetching reseller applications: ${error.message}`,
    };
  }
}
// toggle the active deactive button of a reseller 
async toggleStatus(id: string) {
  const reseller = await this.prisma.reseller.findUnique({
    where: { id },
  });

  if (!reseller) {
    throw new NotFoundException('Reseller not found');
  }

  const newStatus =
    reseller.status === ResellerStatus.active
      ? ResellerStatus.deactive
      : ResellerStatus.active;

  const updated = await this.prisma.reseller.update({
    where: { id },
    data: {
      status: newStatus,
    },
  });

  return {
    success: true,
    message: `Reseller status updated to ${newStatus}`,
    data: updated,
  };
}
}
