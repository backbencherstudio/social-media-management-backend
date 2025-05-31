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

  //Find all resellers
async findAllResellers() {
  try {
    
    const resellers = await this.prisma.reseller.findMany({
      include: {
        user: true,
        reseller_application: true,
        TaskAssign: true, 
      },
    });

    const data = resellers.map((reseller) => {
      return {
        id: reseller.reseller_id,
        full_name: reseller.full_name,
        user_email: reseller.user_email,
        total_earnings: reseller.total_earnings,
        total_task: reseller.total_task,
        skills: reseller.skills,
        completeTask: reseller.complete_tasks,  
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
    console.error('Error fetching resellers:', error);  
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

      
      const newReseller = await this.prisma.reseller.create({
        data: {
          reseller_id: `RES_${createId()}`,  
          user_type: 'reseller',
          user_id:application.user_id,
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
    where: { 
      reseller_id:id
     },
  });

  if (!reseller) {
    throw new NotFoundException('Reseller not found');
  }

  const newStatus =
    reseller.status === ResellerStatus.active
      ? ResellerStatus.deactive
      : ResellerStatus.active;

  const updated = await this.prisma.reseller.update({
    where: { 
       reseller_id:id
     },
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
//Completed task     this will move to the reseller folder
async completeTask(taskId: string, resellerId: string) {
  try {
  
    const task = await this.prisma.taskAssign.findFirst({
      where: {
        id: taskId,
        reseller_id: resellerId,
      },
    });

    if (!task) {
      throw new Error('Task not found or does not belong to this reseller.');
    }

    
    await this.prisma.$transaction(async (prisma) => {
   
      await prisma.taskAssign.update({
        where: { id: taskId },
        data: { status:"completed" }, 
      });

    
      await prisma.reseller.update({
        where: { reseller_id: resellerId },
        data: {
          complete_tasks: { increment: 1 },
        },
      });
    });

    await this.prisma.resellerPayments.create({
     
      data: {
        reseller_id: resellerId,
        task_ammount:task.ammount,
        status: 'pending',
      },
    });

    return {
      message: 'Task successfully completed .',
    };
  } catch (error) {
    console.error('Error completing task:', error);
    throw new Error('Failed to complete task');
  }
}
//get all resellers for payments 
async getAllResellers() {
  try {
    const resellers = await this.prisma.reseller.findMany({
      select: {
        reseller_id: true, 
        full_name: true,
        user_email: true,
        total_task: true,
        total_earnings: true,
        complete_tasks:true,
      },
    });

    const payment = await this.prisma.resellerPayments.findMany({
      select:{
        id:true,
        task_ammount:true,
        status:true,
      }
    })

    return {
      resellers,
      payment
    };
  } catch (error) {
    console.error('Error fetching resellers:', error);
    throw new Error('Error fetching resellers');
  }
}
//admin release paymnet
async releasePayment(resellerId: string) {
  try {
    
    const tasks = await this.prisma.taskAssign.findMany({
      where: {
        reseller_id: resellerId,
        status:'completed'
      },
    });

   
    const totalAmount = tasks.reduce(
      (sum, task) => sum + (task.ammount || 0),
      0
    );

    
    const updatedPayments = await this.prisma.resellerPayments.updateMany({
      where: {
        reseller_id: resellerId,
        status: 'pending',
      },
      data: {
        status: 'paid',
      },
    });

    
    await this.prisma.reseller.update({
      where: { reseller_id: resellerId },
      data: {
        total_earnings: { increment: totalAmount },
      },
    });

    return {
      message: `${updatedPayments.count} payment(s) released successfully.`,
      amount_released: totalAmount,
    };
  } catch (error) {
    console.error('Error releasing payment:', error);
    throw new Error('Failed to release payment');
  }
}
//find One reseller
async getResellerById(resellerId: string) {
  try {
    const reseller = await this.prisma.reseller.findUnique({
      where: {
        reseller_id: resellerId, 
      },
      select: {
        reseller_id: true,
        full_name: true,
        user_email: true,
        total_task: true,
        total_earnings: true,
        complete_tasks: true,
      },
    });

    if (!reseller) {
      throw new Error(`Reseller with ID ${resellerId} not found.`);
    }

    const payment = await this.prisma.resellerPayments.findMany({
      where: {
        reseller_id: resellerId, // Make sure to only get payments for this specific reseller
      },
      select: {
        id: true,
        task_ammount: true,
        status: true,
      },
    });

    return {
      reseller,
      payment,
    };
  } catch (error) {
    console.error('Error fetching reseller:', error);
    throw new Error('Error fetching reseller');
  }
}





}
