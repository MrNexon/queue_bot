import { Injectable } from "@nestjs/common";
import { QueueService } from "../queue/queue.service";
import { QueueUserService } from "../queue-user/queue-user.service";
import { QueueExtendType } from "../queue/queue-extend.type";
import { UserInfoInterface } from "./user-info.interface";

const VkBot = require('node-vk-bot-api');
const Markup = require('node-vk-bot-api/lib/markup');
const api = require('node-vk-bot-api/lib/api');

function keyboard(queue_id) {
    return Markup
      .keyboard([
          [
            Markup.button({
              action: {
                  type: 'callback',
                  label: 'Записаться',
                  payload: JSON.stringify({
                      action: 'add',
                      queue_id: queue_id,
                  }),
              },
              color: 'positive',
          }),
            ], [
              Markup.button({
                  action: {
                      type: 'callback',
                      label: 'Выписаться',
                      payload: JSON.stringify({
                          action: 'remove',
                          queue_id: queue_id,
                      }),
                  },
                  color: 'negative',
              }),
          ], [
          Markup.button({
            action: {
              type: 'callback',
              label: 'Удалить список',
              payload: JSON.stringify({
                action: 'delete',
                queue_id: queue_id,
              }),
            },
            color: 'primary',
          }),
        ]
      ])
      .inline();
}


@Injectable()
export class BotService {
    public bot;

    constructor(
      private queueService: QueueService,
      private queueUserService: QueueUserService
    ){
        this.bot = new VkBot({
            token: process.env.BOT_TOKEN,
            confirmation: process.env.CONFIRMATION,
        });

        this.onMessage = this.onMessage.bind(this);
        this.bot.on(this.onMessage);
        this.bot.event('message_event', this.onMessageEvent.bind(this));
    }

    private async onMessage(ctx) {
        if (ctx.message.peer_id < 2000000000) return;

        if (ctx.message.text.match(/список/i)) await this.onCreateQueue(ctx);
    }

    async onMessageEvent(ctx) {
      if (ctx.message.payload) await this.onButton(ctx);
    }

    async onDeleteQueue(ctx, payload) {
      const queue = await this.queueService.queue({
        id: payload.queue_id}
        );

      if (queue && queue.admin_id !== ctx.message.user_id) {
        await this.snackBarShow(ctx, 'Ты не администратор этого списка!');
        return;
      }

     /* await this.queueService.deleteQueue({
        id: payload.queue_id
      });*/

      try {
        await this.bot.execute('messages.edit', {
          conversation_message_id: ctx.message.conversation_message_id,
          peer_id: ctx.message.peer_id,
          message: 'Список был удален',
          keyboard: Markup.keyboard([])
        });
      } catch (e) {
        console.log(e);
      }

      await this.snackBarShow(ctx, 'Список был удален');
    }

    async onCreateQueue(ctx) {
        const name = ctx.message.text.match(/список ([а-яёй \d]+)/i);
        if (!name[1]) return;

        const queue = await this.queueService.createQueue({
            name: name[1].replace(/ /ig, '_'),
            date: new Date(),
            admin_id: ctx.message.from_id
        });

        ctx.reply(`Новый список создан!
        
Пока в нем 0 учатников. Будь первым!
#${name[1].replace(/ /ig, '_')}_список`, null, keyboard(queue.id))
    }

    async onButton(ctx) {
      const payload = ctx.message.payload;
      switch (payload.action) {
        case 'add':
          return this.onAddUser(ctx, payload);
        case 'remove':
          return this.onRemoveUser(ctx, payload);
        case 'delete':
          return this.onDeleteQueue(ctx, payload);
      }

    }

    async onAddUser(ctx, payload) {
      const queueUsers = await this.queueUserService.queueUsers({
        queue_id: payload.queue_id,
        vk_id: ctx.message.user_id
      });

      if (queueUsers.length > 0) {
        await this.snackBarShow(ctx, 'Ты уже добавлен в список');
        return;
      }

      const userInfo = await this.getUserName(ctx.message.user_id);

      await this.queueUserService.createQueueUser({
        Queue: {
          connect: {
            id: payload.queue_id
          }
        },
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        vk_id: userInfo.id
      });

      const queue = await this.queueService.queue({
        id: payload.queue_id}, {
        QueueUser: true
      })

      await this.genText(ctx.message.conversation_message_id, ctx.message.peer_id, queue);
      await this.snackBarShow(ctx, 'Ты был добавлен в список!');
    }

    async onRemoveUser(ctx, payload) {
      const queueUsers = await this.queueUserService.queueUsers({
        queue_id: payload.queue_id,
        vk_id: ctx.message.user_id
      });

      if (queueUsers.length < 1) {
        await this.snackBarShow(ctx, 'Тебя нет в этом списке');
        return;
      }

      await this.queueUserService.deleteQueueUser({
        id: queueUsers[0].id
      })


      const queue = await this.queueService.queue({
        id: payload.queue_id}, {
        QueueUser: true
      })

      await this.genText(ctx.message.conversation_message_id, ctx.message.peer_id, queue);
      await this.snackBarShow(ctx, 'Ты был удален из списка!');
    }



    async genText(message_id: number, peer_id: number, queue: QueueExtendType) {
      let message = `#${queue.name}_список

`;

      if (queue.QueueUser.length < 1) message += 'В этом списке пока пусто...';
      queue.QueueUser.forEach((user, index) => {
        message += `${index + 1}. ${user.first_name} ${user.last_name}\n`;
      });

      try {
        await this.bot.execute('messages.edit', {
          peer_id: peer_id,
          conversation_message_id: message_id,
          message: message,
          keyboard: keyboard(queue.id)
        });
      } catch (e) {
        console.log(e);
      }
    }

    async snackBarShow(ctx, message: string) {
      try {
        await this.bot.execute('messages.sendMessageEventAnswer', {
          event_id: ctx.message.event_id,
          user_id: ctx.message.user_id,
          peer_id: ctx.message.peer_id,
          event_data: JSON.stringify({
            type: 'show_snackbar',
            text: message
          })
        });
      } catch (e) {
        console.log(e);
      }
    }

    async getUserName(userId: number): Promise<UserInfoInterface> {
      try {
        const response = await api('users.get', {
          user_ids: userId,
          access_token: process.env.BOT_TOKEN,
        });

        return response.response[0]
      } catch (e) {
        console.log(e);
      }
    }

}
