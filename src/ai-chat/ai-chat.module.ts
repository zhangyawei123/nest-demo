import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatService } from './ai-chat.service';
import { AiChatController } from './ai-chat.controller';
import { ChatSession } from './chat-session.entity';
import { ChatMessageEntity } from './chat-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatMessageEntity])],
  providers: [AiChatService],
  controllers: [AiChatController],
})
export class AiChatModule {}
