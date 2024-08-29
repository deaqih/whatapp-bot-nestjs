import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { WhatsappController } from './whatsapp/whatsapp.controller';

@Module({
  imports: [],
  controllers: [AppController, WhatsappController],
  providers: [AppService, WhatsappService],
})
export class AppModule {}
