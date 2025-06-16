import { Injectable } from '@nestjs/common';
import { CreateEmailDto } from './dto/create-email.dto';
import { PrismaService } from '../../../../prisma/prisma.service';
import { MailService } from '../../../../mail/mail.service';
import { CreateEmailForAll } from './dto/create-email-for-all.dto';
import { Email } from 'aws-sdk/clients/codecommit';
import { from } from 'rxjs';
const Imap = require('imap');
const { simpleParser } = require('mailparser');


@Injectable()
export class EmailService {
private readonly imapConfig = {
  user: process.env.MAIL_USERNAME,
  password: process.env.MAIL_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false },
};
  constructor(private readonly Prisma: PrismaService, private mailService: MailService) {}

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
  }
   
async getInboxMails(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.imapConfig);
      const mails: any[] = [];

      function openInbox(cb) {
        imap.openBox('INBOX', true, cb); 
      }

      imap.once('ready', () => {
        openInbox((err, box) => {
          if (err) return reject(err);

          // Get the last 20 messages
          imap.search(['ALL'], (err, results) => {
            if (err || !results || results.length === 0) {
              imap.end();
              return resolve([]);
            }

            const latest = results.slice(-10);
            const fetch = imap.fetch(latest, {
              bodies: '',
              markSeen: false,
            });

            fetch.on('message', (msg, seqno) => {
              let mailBuffer = '';
              let uid: number;

              msg.on('attributes', (attrs) => {
                uid = attrs.uid; 
              });

              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  mailBuffer += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  try {
                    const parsed = await simpleParser(mailBuffer);

                    mails.push({
                      uid,
                      seqno,
                      subject: parsed.subject,
                      from: parsed.from?.text,
                      to: parsed.to?.text,
                      date: parsed.date,
                      text: parsed.text,
                      html: parsed.html,
                      messageId: parsed.messageId,
                    });
                  } catch (parseErr) {
                    console.error('Parse error:', parseErr);
                  }
                });
              });
            });

            fetch.once('error', (err) => {
              console.error('Fetch error:', err);
              reject(err);
            });

            fetch.once('end', () => {
              imap.end();
              resolve(mails);
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('IMAP error:', err);
        reject(err);
      });

      imap.once('end', () => {
        console.log('Connection ended');
      });

      imap.connect();
    });
  }

async getOneMail(uid: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const imap = new Imap(this.imapConfig);

    function openInbox(cb) {
      imap.openBox('INBOX', true, cb); // read-only
    }

    imap.once('ready', () => {
      openInbox((err, box) => {
        if (err) return reject(err);

        const fetch = imap.fetch(uid, {
          bodies: '',
          markSeen: false,
        });

        let mailBuffer = '';
        let seqno: number;

        fetch.on('message', (msg, _seqno) => {
          seqno = _seqno;

          msg.on('body', (stream) => {
            stream.on('data', (chunk) => {
              mailBuffer += chunk.toString('utf8');
            });

            stream.once('end', async () => {
              try {
                const parsed = await simpleParser(mailBuffer);

                resolve({
                  uid,
                  seqno,
                  subject: parsed.subject,
                  from: parsed.from?.text,
                  to: parsed.to?.text,
                  date: parsed.date,
                  text: parsed.text,
                  html: parsed.html,
                  messageId: parsed.messageId,
                  attachments: parsed.attachments?.map((a) => ({
                    filename: a.filename,
                    contentType: a.contentType,
                    size: a.size,
                  })),
                });
              } catch (parseErr) {
                reject(parseErr);
              }
            });
          });
        });

        fetch.once('error', (err) => {
          reject(err);
        });

        fetch.once('end', () => {
          imap.end();
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}



}
