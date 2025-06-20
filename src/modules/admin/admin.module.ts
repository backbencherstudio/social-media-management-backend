import { Module } from '@nestjs/common';
import { FaqModule } from './faq/faq.module';
import { ContactModule } from './contact/contact.module';
import { WebsiteInfoModule } from './admin_settings/website-info/website-info.module';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { NotificationModule } from './notification/notification.module';
import { UserAndRoleManagementModule } from './admin_settings/user_and_role_management/user_and_role_management.module';
import { PaymentAndTransactionModule } from './admin_settings/payment_and_transiction/payment_and_transiction.module';
import { EmailModule } from './help_and_support/email/email.module';
import { EditProfileModule } from './admin_settings/edit-profile/edit-profile.module';
import { OrderPageModule } from './order_page/order_page.module';
import { TaskManagementModule } from './task_management/task_management.module';
import { ClintsModule } from './clints/clints.module';
import { ResellerModule } from './reseller/reseller.module';
import { TeamModule } from './team/team.module';
import { InvoiceModule } from './order_page/invoice/invoice.module';
import { EmailSettingsModule } from './email_settings/email_settings.module';
import { BlogCategoryModule } from './blog/blog_category/blog_category.module';
import { EmailSettingsService } from './email_settings/email_settings.service';
import { SecuritySettingsModule } from './admin_settings/security_settings/security_settings.module';



@Module({
  imports: [
    FaqModule,
    ContactModule,
    WebsiteInfoModule,
    PaymentTransactionModule,
    NotificationModule,
    UserAndRoleManagementModule,
    PaymentAndTransactionModule,
    EmailModule,
    EditProfileModule,
    OrderPageModule,
    TaskManagementModule,
    ClintsModule,
    ResellerModule,
    TeamModule,
    InvoiceModule,
    EmailSettingsModule,
    BlogCategoryModule,
    SecuritySettingsModule 


  ],
    providers: [
    EmailSettingsService, 
  ],
  exports: [
    EmailSettingsService,
  ],
})
export class AdminModule {}
