import { Controller, Get, Inject } from '@nestjs/common';
import { TelegramProvider } from '../providers/telegram.provider';
import { EventPattern } from '@nestjs/microservices';
import { MessageCreateDto } from '@app/application/modules/chat/dto/message-create.dto';
import { TelegramBotInstanceProvider } from '@app/application/modules/telegram/providers/telegram-bot-instance.provider';

@Controller()
export class TelegramController {
  constructor(
    @Inject(TelegramProvider) private telegramProvider: TelegramProvider,
  ) {}

  @Get()
  getHello(): string {
    return 'Hello';
  }

  @EventPattern('newMessage')
  newMessage(data: {
    chatId: number;
    msg: MessageCreateDto;
    botModelId: number;
  }) {
    this.telegramProvider.sendMessage(data);
  }

  @EventPattern('createBot')
  async createBot(data: { botModelId: number }) {
    await TelegramBotInstanceProvider.pushById(data.botModelId);
  }
}
