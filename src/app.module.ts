import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { WhatsappController } from './whatsapp/whatsapp.controller';
import { Throttle, ThrottlerModule, ThrottlerGuard, ThrottlerStorage } from '@nestjs/throttler';
import { APP_GUARD, Reflector } from '@nestjs/core';



@Module({
  imports: [ThrottlerModule.forRoot([
    {
      ttl: 60,
      limit: 10,
    }
  ]),],
  controllers: [AppController, WhatsappController],
  providers: [AppService, WhatsappService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
  ],
})
export class AppModule { }
