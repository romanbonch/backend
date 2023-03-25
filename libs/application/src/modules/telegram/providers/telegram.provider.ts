import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { TelegrafContext } from 'telegraf-ts';
import { ClientProxy } from '@nestjs/microservices';
import { MessageCreateDto } from '@app/application/modules/chat/dto/message-create.dto';
import { FilesProvider } from '@app/application/modules/files/providers/files.provider';
import { TelegramBotInstanceProvider } from '@app/application/modules/telegram/providers/telegram-bot-instance.provider';

@Injectable()
export class TelegramProvider implements OnApplicationBootstrap {
  private botModels = [];
  constructor(
    @Inject('BOT_SERVICE') private botService: ClientProxy,
    @Inject(FilesProvider) private filesProvider: FilesProvider,
  ) {
    TelegramBotInstanceProvider.init(
      (ctx) => this.onMessage(ctx),
      (ctx) => this.onMessageEdit(ctx),
      (ctx) => this.btnCallback(ctx),
    );
  }

  private processMedia(id: string, ctx: TelegrafContext): Promise<string[]> {
    return ctx.telegram.getFileLink(id).then((url) => [url]);
  }

  async onMessage(ctx: TelegrafContext) {
    console.log(TelegramBotInstanceProvider.instances.length);
    // await this.botModels[0].botInstance.telegram.sendMessage(828522413, 'hi', {
    //   reply_markup: {
    //     inline_keyboard: [
    //       /* Inline buttons. 2 side-by-side */
    //       [
    //         { text: 'Button 1', callback_data: 'btn-1' },
    //         { text: 'Button 2', callback_data: 'btn-2' },
    //       ],
    //
    //       /* One button */
    //       [{ text: 'Next', callback_data: 'next' }],
    //
    //       /* Also, we can have URL buttons. */
    //       [{ text: 'Open in browser', url: 'telegraf.js.org' }],
    //     ],
    //   },
    // });

    let message_type = 1;
    let attachments = [];

    if (ctx.updateSubTypes.includes('photo')) {
      message_type = 2; //Photo type
      const id =
        ctx.update.message.photo[ctx.update.message.photo.length - 1].file_id;
      attachments = [{ id, link: await this.processMedia(id, ctx) }];
    } else if (ctx.updateSubTypes.includes('video')) {
      message_type = 3;
      const id = ctx.update.message.video.file_id;
      attachments = [{ id, link: await this.processMedia(id, ctx) }];
    } else if (ctx.updateSubTypes.includes('document')) {
      message_type = 4;
      const id = ctx.update.message.document.file_id;
      attachments = [{ id, link: await this.processMedia(id, ctx) }];
    }

    this.botService
      .emit('newMessage', {
        ctx_: JSON.stringify({
          botInfo: ctx.botInfo,
          message: ctx.update.message,
        }),
        message_type,
        attachments,
      })
      .subscribe((r) => {
        console.log('Result', r);
      });
  }

  btnCallback(ctx: TelegrafContext) {
    console.log(ctx.update.callback_query);
    ctx.reply('ok');
  }

  private async processClientMedia(
    chatId: number,
    type_id: number,
    attachments: number[],
  ): Promise<void> {
    await Promise.all(
      attachments.map(async (el) => {
        const file = await this.filesProvider.getFile(el);
        switch (type_id) {
          case 1:
            return;
          case 2:
            await this.botModels[0].botInstance.telegram.sendPhoto(chatId, {
              source: file.stream,
            });
            break;
          case 3:
            await this.botModels[0].botInstance.telegram.sendVideo(chatId, {
              source: file.stream,
            });
            break;
          case 4:
            await this.botModels[0].botInstance.telegram.sendDocument(chatId, {
              source: file.stream,
              filename: file.name,
            });
            break;
          default:
            return;
        }
      }),
    );
  }

  async sendMessage(data: {
    chatId: number;
    msg: MessageCreateDto;
    botModelId: number;
  }) {
    await this.processClientMedia(
      data.chatId,
      data.msg.type_id,
      data.msg.attachments,
    );
    await Promise.all(
      TelegramBotInstanceProvider.instances.map(async (botInstance) => {
        if (botInstance.model.id == data.botModelId)
          await botInstance.bot.telegram.sendMessage(
            data.chatId,
            data.msg.text,
          );
      }),
    );
  }

  onMessageEdit(ctx: TelegrafContext) {
    this.botService.emit('editMessage', { ctx: ctx }).subscribe();
  }

  onApplicationBootstrap(): any {
    this.botService
      .connect()
      .then(() => {
        console.log('Connected');
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
