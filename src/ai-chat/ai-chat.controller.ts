import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Res,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AiChatService, ChatMessage } from './ai-chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  // ─── 会话 CRUD ───

  @Post('sessions/create')
  async createSession(@Request() req, @Body('title') title?: string) {
    const session = await this.aiChatService.createSession(
      req.user.userId,
      title,
    );
    return session;
  }

  @Post('sessions/list')
  async getSessions(@Request() req) {
    return this.aiChatService.getSessions(req.user.userId);
  }

  @Post('sessions/delete')
  async deleteSession(@Body('sessionId') sessionId: number, @Request() req) {
    await this.aiChatService.deleteSession(Number(sessionId), req.user.userId);
    return null;
  }

  @Post('sessions/update-title')
  async updateSessionTitle(
    @Body('sessionId') sessionId: number,
    @Body('title') title: string,
    @Request() req,
  ) {
    const session = await this.aiChatService.updateSessionTitle(
      Number(sessionId),
      req.user.userId,
      title,
    );
    return session;
  }

  // ─── 消息 ───

  @Post('sessions/messages')
  async getMessages(@Body('sessionId') sessionId: number, @Request() req) {
    return this.aiChatService.getMessages(Number(sessionId), req.user.userId);
  }

  /**
   * 带持久化的流式对话
   * 前端发送 sessionId + 用户消息，后端存库 → 调用 AI → 流式返回 → 存 AI 回复
   */
  @Post('sessions/chat')
  async sessionChatStream(
    @Body('sessionId') sessionIdParam: number,
    @Body('message') userContent: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const sessionId = Number(sessionIdParam);
    const userId = req.user.userId;
    const content = String(userContent || '').trim();
    if (!content) {
      throw new BadRequestException('消息内容不能为空');
    }

    // 验证会话归属
    await this.aiChatService.getSession(sessionId, userId);

    // 存用户消息
    const savedUserMsg = await this.aiChatService.saveMessage(
      sessionId,
      'user',
      content,
    );

    // 如果是第一条消息，自动设置标题
    const allMessages = await this.aiChatService.getMessages(
      sessionId,
      userId,
    );
    if (allMessages.length === 1) {
      await this.aiChatService.autoTitle(sessionId, content);
    }

    // 构建完整消息历史发给 AI
    const chatMessages: ChatMessage[] = allMessages.map((m) => ({
      role: m.role as ChatMessage['role'],
      content: m.content,
    }));

    // SSE 响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 先把 userMsg id 发给前端
    res.write(
      `data: ${JSON.stringify({ type: 'user_msg', id: savedUserMsg.id })}\n\n`,
    );

    let fullReply = '';
    try {
      for await (const chunk of this.aiChatService.chatStream(chatMessages)) {
        fullReply += chunk;
        res.write(
          `data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`,
        );
      }

      // 存 AI 回复
      const savedAssistantMsg = await this.aiChatService.saveMessage(
        sessionId,
        'assistant',
        fullReply,
      );
      res.write(
        `data: ${JSON.stringify({ type: 'assistant_msg', id: savedAssistantMsg.id })}\n\n`,
      );
      res.write('data: [DONE]\n\n');
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Post('sessions/chat-once')
  async sessionChatOnce(
    @Body('sessionId') sessionIdParam: number,
    @Body('message') userContent: string,
    @Request() req,
  ) {
    const sessionId = Number(sessionIdParam);
    const userId = req.user.userId;
    const content = String(userContent || '').trim();
    if (!content) {
      throw new BadRequestException('消息内容不能为空');
    }

    await this.aiChatService.getSession(sessionId, userId);

    const savedUserMsg = await this.aiChatService.saveMessage(
      sessionId,
      'user',
      content,
    );

    const allMessages = await this.aiChatService.getMessages(
      sessionId,
      userId,
    );
    if (allMessages.length === 1) {
      await this.aiChatService.autoTitle(sessionId, content);
    }

    const chatMessages: ChatMessage[] = allMessages.map((m) => ({
      role: m.role as ChatMessage['role'],
      content: m.content,
    }));
    const reply = await this.aiChatService.chat(chatMessages);
    const savedAssistantMsg = await this.aiChatService.saveMessage(
      sessionId,
      'assistant',
      reply,
    );

    return {
      reply,
      userMessage: savedUserMsg,
      assistantMessage: savedAssistantMsg,
    };
  }

  // ─── 旧接口（兼容）───

  @Post()
  async chat(@Body('messages') messages: ChatMessage[]) {
    const reply = await this.aiChatService.chat(messages);
    return { reply };
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
