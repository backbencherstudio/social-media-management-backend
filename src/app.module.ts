// external imports
import { MiddlewareConsumer, Module } from '@nestjs/common';
// import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
// import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
// import { BullModule } from '@nestjs/bullmq';

// internal imports
import appConfig from './config/app.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AbilityModule } from './ability/ability.module';
import { MailModule } from './mail/mail.module';
import { ApplicationModule } from './modules/application/application.module';
import { AdminModule } from './modules/admin/admin.module';
import { BullModule } from '@nestjs/bullmq';
import { ChatModule } from './modules/chat/chat.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PostModule } from './modules/reseller/post/post.module';
import { ServiceManagementModule } from './modules/admin/sevice-management/service-management.module'
import { BlogModule } from './modules/admin/blog/blog.module'
import { UserModule } from './modules/chat/user/user.module';
import { FeatureModule } from './modules/admin/features/featuers_module';
import { CategoryModule } from './modules/admin/sevice-management/category/category.module';
import { BlogCategoryModule } from './modules/admin/blog/blog_category/blog_category.module';
import { WebsiteInfoModule } from './modules/admin/admin_settings/website-info/website-info.module';
import { AiChatbotModule } from './aichatbot/ai-chatbot.module';
import { DesignFileModule } from './modules/reseller/design-file/design-file.module';
import { SocialsModule } from './modules/socials/socials.module';
import { DashboardModule } from './modules/reseller/dashboard/dashboard.module';
import { ResellerProfile } from './modules/reseller/reseller_profile/entities/reseller_profile.entity';
import { ResellerProfileModule } from './modules/reseller/reseller_profile/reseller_profile.module';
import { AssetsModule } from './modules/reseller/assets/assets.module';
import { PostModule as UserPostModule } from './modules/user/post/post.module';
import { AssetsModule as UserAssetsModule } from './modules/user/assets/assets.module';
import { OrderModule } from './modules/order/order.module';
import { DashboardModule as UserDashboardModule } from './modules/user/dashboard/dashboard.module';
import { ServiceModule } from './modules/user/service/service.module';
import { NotificationModule } from './modules/reseller/notification/notification.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    BullModule.forRoot({
      connection: {
        host: appConfig().redis.host,
        password: appConfig().redis.password,
        port: +appConfig().redis.port,
      },
    }),
    PrismaModule,
    AuthModule,
    AbilityModule,
    MailModule,
    ApplicationModule,
    AdminModule,
    ChatModule,
    PaymentModule,
    PostModule,
    ServiceManagementModule,
    BlogModule,
    FeatureModule,
    CategoryModule,
    UserModule,
    BlogCategoryModule,
    WebsiteInfoModule,
    AiChatbotModule,
    DesignFileModule,
    SocialsModule,
    DashboardModule,
    ResellerProfileModule,
    AssetsModule,
    UserPostModule,
    UserAssetsModule,
    OrderModule,
    UserDashboardModule,
    ServiceModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
