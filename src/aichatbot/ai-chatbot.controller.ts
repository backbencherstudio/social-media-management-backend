import { Controller, Post, Body, InternalServerErrorException } from '@nestjs/common'
import { AiChatbotService } from './ai-chatbot.service'

@Controller('/chat')
export class AiChatbotController {
  constructor(private readonly aiChatbotService: AiChatbotService) {}

  @Post()
  async chat(@Body('message') message: string) {
    try {
      const response = await this.aiChatbotService.handleChat(message);
      return {
        success: true,
        response,
      };
    } catch (error) {
      console.error('Chat controller error:', error);

      // You can choose to rethrow or format it as JSON
      throw new InternalServerErrorException(
        error.message || 'Failed to process chat message.',
      );
    }
  }
}
