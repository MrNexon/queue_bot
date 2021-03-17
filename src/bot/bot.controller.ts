import { Controller, Post, Request, Response } from '@nestjs/common';
import { BotService } from './bot.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('bot')
export class BotController {
    constructor(
        private botService: BotService,
        private eventEmitter: EventEmitter2
    ) {
        /*eventEmitter.on('notification.group', this.onGroup.bind(this));
        eventEmitter.on('bot.remove_chat_user', this.onRemoveChatUser.bind(this));*/
    }

    @Post()
    botEndpoint(@Request() req, @Response() res) {
        this.botService.bot.webhookCallback(req, res);
    }
}

