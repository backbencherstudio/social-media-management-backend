import { Injectable } from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { PrismaService } from '../../../../prisma/prisma.service';
import { MailService } from '../../../../mail/mail.service';
import { CreateEmailForAll } from './dto/create-email-for-all.dto';


@Injectable()
export class EmailService {
  constructor(private readonly Prisma: PrismaService, private mailService: MailService) {}
  
  // this is for sent emails 

  async createEmail(data: CreateEmailDto) {
    try {
      const user = await this.Prisma.user.findUnique({
        where: { email: data.recipient_emails },
      });
  
      if (!user) {
        return {
          success: false,
          message: `User with email ${data.recipient_emails} not found.`,
        };
      }
  
      const emailHistory = await this.Prisma.emailHistory.create({
        data: {
          type: data.type,
          subject: data.subject,
          body: data.body,
          email_history_recipients: {
            create: {
              recipient: {
                connect: { email: data.recipient_emails },
              },
            },
          },
        },
        select: {
          id: true,
          type: true,
          subject: true,
          body: true,
          created_at: true,
          email_history_recipients: {
            select: {
              id: true,
              recipient: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      await this.mailService.supportEmail({
        email: data.recipient_emails,
      name: user.name || data.recipient_emails, 
      subject: data.subject || 'Support Request Received',
      message: 'We have received your support request. Our team will respond shortly.'
      });

  
      return {
        success: true,
        message: 'Email history created successfully',
        data: emailHistory,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async createEmailForAllUsers(data: CreateEmailForAll) {
    try {
      const users = await this.Prisma.user.findMany({
        select: { id: true, email: true, name: true },
      });
  
      if (!users.length) {
        return {
          success: false,
          message: 'No registered users found.',
        };
      }
  
      // Create emailHistory with all recipients
      const emailHistory = await this.Prisma.emailHistory.create({
        data: {
          type: data.type,
          subject: data.subject,
          body: data.body,
          email_history_recipients: {
            create: users.map(user => ({
              recipient: {
                connect: { email: user.email },
              },
            })),
          },
        },
        select: {
          id: true,
          type: true,
          subject: true,
          body: true,
          created_at: true,
          email_history_recipients: {
            select: {
              id: true,
              recipient: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
  
      // Send support email to each user
      for (const user of users) {
        await this.mailService.supportEmail({
          email: user.email,
          name: user.name || user.email,
          subject: data.subject || 'Support Notification',
          message: data.body || 'We have an important update for you.',
        });
      }
  
      return {
        success: true,
        message: 'Email history created and emails sent to all users successfully',
        data: emailHistory,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async findAll() {
    try {
      const emails = await this.Prisma.emailHistory.findMany({
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          type: true,
          subject: true,
          created_at: true,
          email_history_recipients: {
            select: {
              recipient: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });
  
      return {
        success: true,
        message: 'Email history fetched successfully',
        data: emails,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  async findOne(id: string) {
    try {
      const email = await this.Prisma.emailHistory.findUnique({
        where: { id },
        select: {
          id: true,
          body: true,
          type: true,
          subject: true,
          created_at: true,
          email_history_recipients: {
            select: {
              recipient: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });
  
      if (!email) {
        return {
          success: false,
          message: `Email history with ID ${id} not found.`,
        };
      }
  
      return {
        success: true,
        message: 'Email history fetched successfully',
        data: email,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
  

  //getting all the user sent emails
  async findAllUsersEmails() {
    try {
      const emails = await this.Prisma.emailHistory.findMany({
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          type: true,
          subject: true,
          created_at: true,
          email_history_recipients: {
            select: {
              recipient: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      });
  
      return {
        success: true,
        message: 'Email history fetched successfully',
        data: emails,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  } // not completed yet


}
