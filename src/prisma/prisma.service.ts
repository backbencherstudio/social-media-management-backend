
import {
  Logger,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { SoftdeleteMiddleware } from './middleware/softdelete.middleware';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit, OnModuleDestroy

  
{
    
  hastags: any;
  blogTag: any;
  blogBlock: any;

  private readonly logger = new Logger(PrismaService.name);
    private _chatLog: any;
    private _blogCategory: any;
  hashtags: any;
  
  public get blogCategory(): any {
    return this._blogCategory;
  }
  public set blogCategory(value: any) {
    this._blogCategory = value;
  }
  public get chatLog(): any {
    return this._chatLog;
  }
  public set chatLog(value: any) {
    this._chatLog = value;
  }

  constructor() {
    super({ log: [{ emit: 'event', level: 'query' }] });

    // this.logger.log(`Prisma v${Prisma.prismaVersion.client}`);
    // dfd
    // this.$on('query', (e) => this.logger.debug(`${e.query} ${e.params}`));

    // comment out this when seeding data using command line
    if (process.env.PRISMA_ENV == '1') {
      console.log('Prisma Middleware not called', process.env.PRISMA_ENV);
    } else {
      //Middlewares
      this.$use(SoftdeleteMiddleware);
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // async enableShutdownHooks(app: INestApplication) {
  //   this.$on('beforeExit', async () => {
  //     await app.close();
  //   });
  // }
}
