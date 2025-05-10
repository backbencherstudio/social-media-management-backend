import { Module } from '@nestjs/common'
import { AiChatbotService } from './ai-chatbot.service'
import { AiChatbotController } from './ai-chatbot.controller'

@Module({
  controllers: [AiChatbotController],
  providers: [AiChatbotService],
})
export class AiChatbotModule {}
