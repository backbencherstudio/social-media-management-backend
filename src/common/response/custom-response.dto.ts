import { ApiProperty } from '@nestjs/swagger';

class Message {
  @ApiProperty({
    description: 'An array of messages or errors to return',
    example: ['You must agree to the terms and conditions'],
  })
  message: string[];

  @ApiProperty({
    description: 'Error description',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;
}

export class CustomResponse {
  @ApiProperty({
    description: 'Indicates whether the response is successful or not',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Detailed message/error',
    type: Message,
  })
  message: Message;
}
