import { Controller, Get, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  getStatus(): string {
    return 'WhatsApp bot is running!';
  }

  @Post('send-message')
  async sendMessage(@Body() body: { number: string; message: string; apikey: string}) {
    const { number, message, apikey } = body;
    return await this.whatsappService.sendMessage(number, message, apikey);
  }

  @Post('send-image')
  async sendImage(@Body() body: { number: string; imageUrl: string; caption: string; apikey: string }) {
    const { number, imageUrl, caption, apikey } = body;
    return await this.whatsappService.sendImage(number, imageUrl, caption, apikey);
  }
}
