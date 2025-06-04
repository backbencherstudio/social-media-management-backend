// chat.module.ts
import { Module } from '@nestjs/common';
import { MessageModule } from './message/message.module'; // Import MessageModule
import { UserModule } from './user/user.module'; // Import UserModule
import { MsgController } from './message/message.controller';


@Module({
  imports: [MessageModule, UserModule], // Ensure MessageModule is imported
  controllers: [MsgController], // Add MsgController to the controllers array
})
export class ChatModule {}
