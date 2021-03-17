import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotMiddleware } from './bot.middleware';
import { BotController } from './bot/bot.controller';
import { BotService } from './bot/bot.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from './prisma.serivce';
import { QueueService } from './queue/queue.service';
import { QueueUserService } from './queue-user/queue-user.service';

@Module({
  imports: [ConfigModule.forRoot(), EventEmitterModule.forRoot()],
  controllers: [BotController],
  providers: [BotService, PrismaService, QueueService, QueueUserService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer.apply(BotMiddleware).forRoutes('bot');
  }
}
