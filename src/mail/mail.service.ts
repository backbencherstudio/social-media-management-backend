import { Injectable } from '@nestjs/common';
import appConfig from '../config/app.config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('mail2-queue') private queue: Queue,
    private mailerService: MailerService,
  ) { }

  async sendMemberInvitation({ user, member, url }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subject = `${user.fname} is inviting you to ${appConfig().app.name}`;

      // add to queue
      await this.queue.add('sendMemberInvitation', {
        to: member.email,
        from: from,
        subject: subject,
        template: 'member-invitation',
        context: {
          user: user,
          member: member,
          url: url,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  // send otp code for email verification
  async sendOtpCodeToEmail({ name, email, otp }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subject = 'Email Verification';

      // add to queue
      await this.queue.add('sendOtpCodeToEmail', {
        to: email,
        from: from,
        subject: subject,
        template: 'email-verification',
        context: {
          name: name,
          otp: otp,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendVerificationLink(params: {
    email: string;
    name: string;
    link: string;
  }) {

    await this.mailerService.sendMail({
      to: params.email,
      subject: 'Verify Your Email',
      template: './verification-link',
      context: {
        link: params.link,
        name: params.name  // Add this line to pass the name to the template
      },
    });
  }

  async supportEmail(params: {
    email: string;
    name: string;
    subject: string;
    message: string;
  }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;

      //add queue
      await this.queue.add('sendSupportEmail', {
        to: params.email,
        from: from,
        subject: params.subject,
        template: 'support-email',
        context: {
          name: params.name,
          message: params.message,
        },
      });
    } catch (error) {
      console.error('Failed to add support email to queue:', error);
    }
  }


  async submitSuccessEmail(params: {
    email: string;
    name: string;
  }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;

      await this.queue.add('applicationSubmittedSuccess', {
        to: params.email,
        from: from,
        subject: 'Your Application has been submitted successfully',
        template: 'submitted-success',
        context: {
          name: params.name,
        },
      });
    } catch (error) {
      console.error('Failed to queue application rejected email:', error);
    }
  }


  async applicationAcceptedEmail(params: {
    email: string;
    name: string;
  }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;

      await this.queue.add('sendAccept', {
        to: params.email,
        from: from,
        subject: 'Your Reseller Application Has Been Accepted!',
        template: 'accepted',
        context: {
          name: params.name,
        },
      });
    } catch (error) {
      console.error('Failed to queue application accepted email:', error);
    }
  }

  async applicationRejectedEmail(params: {
    email: string;
    name: string;
    reason?: string;
  }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;

      await this.queue.add('sendReject', {
        to: params.email,
        from: from,
        subject: 'Your Reseller Application Was Not Approved',
        template: 'rejected',
        context: {
          name: params.name,
          reason: params.reason || 'We appreciate your interest, but your application did not meet our criteria at this time.',
        },
      });
    } catch (error) {
      console.error('Failed to queue application rejected email:', error);
    }
  }


  async confirmAdminMail(params: {
    email: string;
    name: string;
    password: string;
  }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;

      await this.queue.add('confirmAdminMail', {
        to: params.email,
        from: from,
        subject: 'Congratulations! Now You are also an Admin',
        template: 'sendAdminReqEmai',
        context: {
          email: params.email,
          name: params.name,
          password: params.password,
        },
      });
    } catch (error) {
      console.error('Failed to queue admin email:', error);
    }
  }



}
