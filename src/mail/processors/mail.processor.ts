import { MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';

@Processor('mail4-queue1')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  constructor(private mailerService: MailerService, private prisma: PrismaService) {
    super();
  }

  async setMailTransport() {
    const emailSettings = await this.prisma.emailSettings.findFirst();
    console.log("from mail processor", emailSettings);

    this.mailerService.addTransporter("mail", {
      host: emailSettings.smtpHost,
      port: emailSettings.smtpPort,
      auth: {
        user: emailSettings.smtpUsername,
        pass: emailSettings.smtpPassword,
      },
      from: emailSettings.smtpFrom,
    })

  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} with name ${job.name} completed`);
  }

  async process(job: Job): Promise<any> {
    await this.setMailTransport()
    this.logger.log(`Processing job ${job.id} with name ${job.name}`);
    try {
      switch (job.name) {
        case 'sendMemberInvitation':
          this.logger.log('Sending member invitation email');
          await this.mailerService.sendMail({
            transporterName: "mail",
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
          });
          break;
        case 'sendOtpCodeToEmail':
          this.logger.log('Sending OTP code to email');

          await this.mailerService.sendMail({
            transporterName: "mail",
            to: job.data.to,
            from: job.data.from,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
          });
          break;
        case 'sendVerificationLink':
          this.logger.log('Sending verification link');
          await this.mailerService.sendMail({
            to: job.data.to,
            subject: job.data.subject,
            template: job.data.template,
            context: job.data.context,
          });
          break;
        case 'sendSupportEmail':
          this.logger.log('Sending support email');
          await this.mailerService.sendMail({
            transporterName: "mail",
            to: job.data.to,
            from: job.data.from || 'support@example.com',
            subject: job.data.subject || 'Support Request Received',
            template: job.data.template || 'support-email',
            context: {
              name: job.data.context?.name,
              message: job.data.context?.message,
            },
          });
          break;
        case 'applicationSubmittedSuccess':
          this.logger.log('Sending success email');
          await this.mailerService.sendMail({
            transporterName: "mail",
            to: job.data.to,
            from: job.data.from || 'support@example.com',
            subject: job.data.subject || 'Success',
            template: job.data.template || 'submitted-success',
            context: {
              name: job.data.context?.name,
              message: job.data.context?.message,
            },
          });
          break;
        case 'sendAccept':
          this.logger.log('Sending success email');
          await this.mailerService.sendMail({
            transporterName: "mail",
            to: job.data.to,
            from: job.data.from || 'support@example.com',
            subject: job.data.subject || 'Support Request Received',
            template: job.data.template || 'accepted',
            context: {
              name: job.data.context?.name,
              message: job.data.context?.message,
            },
          });
          break;
        case 'sendReject':
          this.logger.log('Sending success email');
          await this.mailerService.sendMail({
            transporterName: "mail",
            to: job.data.to,
            from: job.data.from || 'support@example.com',
            subject: job.data.subject || 'Support Request Received',
            template: job.data.template || 'rejected',
            context: {
              name: job.data.context?.name,
              message: job.data.context?.message,
            },
          });
          break;

        case 'sendInviteSuccess':
          this.logger.log('Sending success email');
          await this.mailerService.sendMail({
            transporterName: "mail",
            to: job.data.to,
            from: job.data.from || 'support@example.com',
            subject: job.data.subject || 'Congratualtions',
            template: job.data.template || '',
            context: {
              name: job.data.context?.name,
              message: job.data.context?.message,
            },
          });
          break;
        case 'confirmAdminMail':
          this.logger.log('Sending success email');
          console.log("job.data.to", job.data.to);


          await this.mailerService.sendMail({
            transporterName: "mail",
            to: job.data.to,
            from: job.data.from || 'support@example.com',
            subject: job.data.subject || 'Congratualtions',
            template: job.data.template || '',
            context: {
              name: job.data.context?.name,
              email: job.data.context?.email,
              password: job.data.context?.password,
            },
          });
          break;


        default:
          this.logger.log('Unknown job name');
          return;
      }
    } catch (error) {
      this.logger.error(
        `Error processing job ${job.id} with name ${job.name}`,
        error,
      );
      throw error;
    }
  }
}
