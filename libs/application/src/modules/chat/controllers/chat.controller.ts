import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { AdminGuard } from '../../../guards/admin.guard';
import {
  ResponseFilter,
  ResponseStatus,
} from '../../../filters/response.filter';
import { UserModel } from '../../user/models/user.model';
import { ChatProvider } from '../providers/chat.provider';
import { BotModel } from '../../bot/models/bot.model';
import { UserMessageModel } from '../../bot/models/user-message.model';
import { ChatGateway } from '../providers/chat.gateway';

@Controller('bot')
export class ChatController {
  constructor(
    @Inject(ChatProvider) private botProvider: ChatProvider,
    @Inject(ChatGateway) private chatGateway: ChatGateway,
  ) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':companyId')
  @HttpCode(ResponseStatus.SUCCESS)
  public async getBot(
    @Param('companyId') companyId: number,
  ): Promise<ResponseFilter<BotModel[]>> {
    return ResponseFilter.response<BotModel[]>(
      await this.botProvider.getByCompany(companyId),
      ResponseStatus.SUCCESS,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('')
  @HttpCode(ResponseStatus.SUCCESS)
  public async getByToken(@Req() req): Promise<ResponseFilter<BotModel[]>> {
    return ResponseFilter.response<BotModel[]>(
      await this.botProvider.getByUser(req.user.id),
      ResponseStatus.SUCCESS,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':botId/subs')
  @HttpCode(ResponseStatus.SUCCESS)
  public async getSubscribers(
    @Param('botId') botId: number,
  ): Promise<ResponseFilter<UserModel[]>> {
    return ResponseFilter.response<UserModel[]>(
      await this.botProvider.getSubscribers(botId),
      ResponseStatus.SUCCESS,
    );
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':botId/chat/:userId')
  @HttpCode(ResponseStatus.SUCCESS)
  public async getHistory(
    @Param('userId') userId: number,
    @Param('botId') botId: number,
  ): Promise<ResponseFilter<UserMessageModel[]>> {
    return ResponseFilter.response<UserMessageModel[]>(
      await this.botProvider.getMessages(botId, userId),
      ResponseStatus.SUCCESS,
    );
  }

  // @Get('/send/:botId/:msg')
  // public async sendMessage(
  //   @Param('botId') botId: number,
  //   @Param('msg') msg: string
  // ) {
  //   const bot = await BotModel.findOne({ where: { id: botId } });
  //   this.service.emit('newMessage', { msg });
  // }
  //
  // @EventPattern('newMessage')
  // public async tgBotNewMessage(data: any) {
  //   this.chatGateway.server.to(`chat58`).emit('msg', data.data);
  //   // console.log(data.data);
  // }
}
