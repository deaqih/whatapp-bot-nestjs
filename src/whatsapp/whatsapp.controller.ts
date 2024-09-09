import { Controller, Get, Post, Body, Res, Injectable, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ThrottlerModule, SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
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

  @Throttle({ default: { limit: 40, ttl: 60000 } })
  @Post('send-image')
  async sendImage(@Body() body: { number: string; imageUrl: string; caption: string; apikey: string }) {
    const { number, imageUrl, caption, apikey } = body;
    return await this.whatsappService.sendImage(number, imageUrl, caption, apikey);
  }

  @Post('groups')
  async getGroups(
    @Body('apikey') apikey: string,
  ) {
    return await this.whatsappService.getAllGroups(apikey);
  }

  @Post('send-to-group')
  async sendMessageToGroup(
    @Body('groupNameOrId') groupNameOrId: string,
    @Body('message') message: string,
    @Body('apikey') apikey: string,
  ) {
    //await this.whatsappService.sendMessageToGroup(groupNameOrId, message, apikey);
    // return { status: 'Message sent to group' };
    return await this.whatsappService.sendMessageToGroup(groupNameOrId, message, apikey);
  }

  @Post('check-session')
  async checkSession(@Body('apikey') apikey: string, @Res() res: Response) {
    // Panggil service untuk cek sesi WhatsApp dengan API Key
    const sessionStatus = await this.whatsappService.checkSession(apikey);

    // Mengembalikan respons secara langsung berdasarkan hasil dari service
    return res.status(sessionStatus.statusCode).json({
      statusCode: sessionStatus.statusCode,
      message: sessionStatus.message,
      data: sessionStatus.data || null
    });
  }
}
