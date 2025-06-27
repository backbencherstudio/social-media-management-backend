import { Global, Module } from '@nestjs/common';
import { AdminModule } from 'src/modules/admin/admin.module';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { MailerModule } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bullmq';
import { MailProcessor } from './processors/mail.processor';
import { MailService } from './mail.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Global()
@Module({
  imports: [
    AdminModule,
    MailerModule.forRootAsync({
      imports: [AdminModule],
      inject: [PrismaService],
      useFactory: async (prismaService: PrismaService) => {
        const emailSettings = await prismaService.emailSettings.findFirst();
        console.log(emailSettings);

        if (!emailSettings) {
          throw new Error('Email settings not found in the database.');
        }

        console.log("emailSettings.smtpHost", emailSettings.smtpHost);


        return {
          transport: {
            host: emailSettings.smtpHost,
            port: emailSettings.smtpPort,
            auth: {
              user: emailSettings.smtpUsername,
              pass: emailSettings.smtpPassword,
            },
            from: emailSettings.smtpFrom,
          },
          defaults: {
            from: `"No Reply" <${emailSettings.smtpUsername}>`,
          },
          template: {
            dir: process.cwd() + '/dist/mail/templates/',
            adapter: new EjsAdapter(),
            options: {

            },
          },
        };
      },
    }),


    BullModule.registerQueue({
      name: 'mail4-queue1',
    }),
  ],
  providers: [
    MailService,
    MailProcessor,
  ],

  exports: [MailService],
})
export class MailModule { }
