import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EmailSettingsService } from 'src/modules/admin/email_settings/email_settings.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('mail4-queue1') private readonly queue: Queue,
    private readonly emailSettingsService: EmailSettingsService,
    private readonly prisma: PrismaService,
  ) { }


  private async getFromAddress(): Promise<string> {
    const emailSettings = await this.prisma.emailSettings.findUnique({
      where: { id: 1 },
    });;
    if (!emailSettings) {
      throw new Error('Email settings not found in the database.');
    }

    return `${process.env.APP_NAME || 'Support'} <${emailSettings.smtpUsername}>`;
  }

  async sendOtpCodeToEmail({ name, email, otp }) {
    try {
      const from = await this.getFromAddress();
      const subject = 'Email Verification';

      await this.queue.add('sendOtpCodeToEmail', {
        to: email,
        from,
        subject,
        template: 'email-verification',
        context: { name, otp },
      });
    } catch (error) {
      console.error('Failed to queue OTP email:', error);
    }
  }

  async sendVerificationLink(params: { email: string; name: string; link: string }) {
    try {
      const from = await this.getFromAddress();

      await this.queue.add('sendVerificationLink', {
        to: params.email,
        from,
        subject: 'Verify Your Email',
        template: 'verification-link',
        context: {
          name: params.name,
          link: params.link,
        },
      });
    } catch (error) {
      console.error(' Failed to queue verification link email:', error);
    }
  }

  async supportEmail(params: { email: string; name: string; subject: string; message: string }) {
    try {
      const from = await this.getFromAddress();

      await this.queue.add('sendSupportEmail', {
        to: params.email,
        from,
        subject: params.subject,
        template: 'support-email',
        context: {
          name: params.name,
          message: params.message,
        },
      });

      console.log(`Support email queued to: ${params.email}`);
    } catch (error) {
      console.error(' Failed to queue support email:', error);
      throw error;
    }
  }

  async submitSuccessEmail(params: { email: string; name: string }) {
    try {
      const from = await this.getFromAddress();

      await this.queue.add('applicationSubmittedSuccess', {
        to: params.email,
        from,
        subject: 'Your Application has been submitted successfully',
        template: 'submitted-success',
        context: { name: params.name },
      });
    } catch (error) {
      console.error(' Failed to queue application submitted email:', error);
    }
  }

  async applicationAcceptedEmail(params: { email: string; name: string }) {
    try {
      const from = await this.getFromAddress();

      await this.queue.add('sendAccept', {
        to: params.email,
        from,
        subject: 'Your Reseller Application Has Been Accepted!',
        template: 'accepted',
        context: { name: params.name },
      });
    } catch (error) {
      console.error(' Failed to queue application accepted email:', error);
    }
  }

  async applicationRejectedEmail(params: { email: string; name: string; reason?: string }) {
    try {
      const from = await this.getFromAddress();

      await this.queue.add('sendReject', {
        to: params.email,
        from,
        subject: 'Your Reseller Application Was Not Approved',
        template: 'rejected',
        context: {
          name: params.name,
          reason:
            params.reason ||
            'We appreciate your interest, but your application did not meet our criteria at this time.',
        },
      });
    } catch (error) {
      console.error(' Failed to queue application rejected email:', error);
    }
  }

  async confirmAdminMail(params: { email: string; name: string; password: string }) {
    try {
      const from = await this.getFromAddress();

      await this.queue.add('confirmAdminMail', {
        to: params.email,
        from,
        subject: 'Congratulations! Now You are also an Admin',
        template: 'sendAdminReqEmai',
        context: {
          email: params.email,
          name: params.name,
          password: params.password,
        },
      });
    } catch (error) {
      console.error('Failed to queue admin confirmation email:', error);
    }
  }
}
