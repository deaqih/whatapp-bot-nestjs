import { Controller, Get, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import * as dotenv from 'dotenv';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) { }

  @Get('status')
  getStatus(): string {
    return 'WhatsApp bot is running!';
  }

  @Post('send-message')
  async sendMessage(@Body() body: { number: string; message: string; apikey: string }) {
    const { number, message, apikey } = body;
    return await this.whatsappService.sendMessage(number, message, apikey);
  }

  @Post('send-image')
  async sendImage(@Body() body: { number: string; imageUrl: string; caption: string; apikey: string }) {
    const { number, imageUrl, caption, apikey } = body;
    return await this.whatsappService.sendImage(number, imageUrl, caption, apikey);
  }

  @Get('groups')
  async getGroups() {
    const groups = await this.whatsappService.getAllGroups();
    return groups;
  }

  @Post('send-to-group')
    async sendMessageToGroup(
        @Body('groupNameOrId') groupNameOrId: string,
        @Body('message') message: string,
        @Body('apikey') apikey: string,
    ) {
        await this.whatsappService.sendMessageToGroup(groupNameOrId, message, apikey);
        return { status: 'Message sent to group' };
    }
}
