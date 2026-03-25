import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AiChatService, ChatMessage } from './ai-chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post()
  async chat(@Body('messages') messages: ChatMessage[]) {
    const reply = await this.aiChatService.chat(messages);
    return { code: 200, message: '成功', data: { reply } };
  }

  @Post('stream')
  async chatStream(
    @Body('messages') messages: ChatMessage[],
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const chunk of this.aiChatService.chatStream(messages)) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
