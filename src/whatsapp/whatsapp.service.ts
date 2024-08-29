import { Injectable } from '@nestjs/common';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';
import * as qrcode from 'qrcode-terminal';
import * as dotenv from 'dotenv';

dotenv.config(); // Mengambil konfigurasi dari .env

@Injectable()
export class WhatsappService {
  private client: Client;

  constructor() {
    /*this.client = new Client({
        authStrategy: new LocalAuth(),
    }); */

    /*this.client = new Client({
        authStrategy: new LocalAuth({ clientId: "client-one" }),
      });*/

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    this.client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
        console.log('WhatsApp bot is ready!');
      });

    this.client.on('authenticated', () => {
        console.log('WhatsApp authenticated!');
      });
    
    this.client.on('auth_failure', msg => {
        console.error('Authentication failure:', msg);
      });

    this.client.on('disconnected', (reason) => {
        console.log('WhatsApp disconnected:', reason);
        this.client.initialize(); // Re-initialize the client
      });

    this.client.initialize();
  }

  async sendMessage(number: string, message: string, apikey: string) {
    //await this.client.initialize(); // Ensure client is initialize
    const validApiKey = process.env.API_KEY; // Mengambil API key dari variabel lingkungan
    if (apikey == validApiKey) {
    const chatId = `${number}@c.us`; // Format nomor telepon untuk WhatsApp
    try {
      await this.client.sendMessage(chatId, message);
      return { status: 'success', message: `Message sent to ${number}` };
    } catch (error) {
      console.error('Error sending message:', error);
      return { status: 'error', message: `Failed to send message to ${number}` };
    }}

    else {
        return 'salah';
    }
  }

  async sendImage(number: string, imageUrl: string, caption: string, apikey: string) {
    //await this.client.initialize(); // Ensure client is initialize
    const validApiKey = process.env.API_KEY; // Mengambil API key dari variabel lingkungan
    if (apikey == validApiKey) {
    const chatId = `${number}@c.us`;
    try {
      // Download image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const media = new MessageMedia('image/jpeg', Buffer.from(response.data).toString('base64'));

      // Send image with caption
      await this.client.sendMessage(chatId, media, { caption });
      return { status: 'success', message: `Image sent to ${number}` };
    } catch (error) {
      console.error('Error sending image:', error);
      return { status: 'error', message: `Failed to send image to ${number}` };
    }}

    else {
        return 'salah';
    }}
}