import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, LocalAuth, MessageMedia, Chat, Message } from 'whatsapp-web.js';
import axios from 'axios';
import * as qrcode from 'qrcode-terminal';
import * as dotenv from 'dotenv';

dotenv.config(); // Mengambil konfigurasi dari .env

@Injectable()
export class WhatsappService {
  private client: Client;

  // Array berisi nomor-nomor yang akan mendapatkan balasan otomatis
  //private targetNumbers = process.env.numbers;
  private config = JSON.parse(process.env.config);

  constructor() {
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

    // Tambahkan handler untuk pesan masuk
    this.client.on('message', (message) => this.handleIncomingMessage(message));

    this.client.initialize();
  }

  // Fungsi untuk menangani pesan masuk
  private async handleIncomingMessage(message: Message): Promise<void> {
    const chat = await message.getChat();
    const targetNumbers: string[] = this.config.numbers;
    const targetGroups: string[] = this.config.groups;
    if (targetNumbers.includes(message.from)) {
      // Logika untuk balasan otomatis
      if (message.body.toLowerCase() === 'halo') {
        chat.sendMessage(this.config.halo);
      } else if (message.body.toLowerCase() === 'info') {
        chat.sendMessage(this.config.info);
      } else if (message.body.toLowerCase() === 'sisy') {
        chat.sendMessage(this.config.sisy);
      }
    } else if (chat.isGroup && targetGroups.includes(chat.id._serialized)) {
      // Logika untuk balasan otomatis di dalam grup
      if (message.body.toLowerCase() === 'halo') {
        await chat.sendMessage(this.config.halo);
      } else if (message.body.toLowerCase() === 'info') {
        await chat.sendMessage(this.config.info);
      } else if (message.body.toLowerCase() === 'sisy') {
        await chat.sendMessage(this.config.sisy);
      }
    }
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
      }
    }

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
      }
    }

    else {
      return 'salah';
    }
  }

  async getAllGroups(apikey: string): Promise<{ name: string; id: string }[]> {
    const validApiKey = process.env.API_KEY; // Mengambil API key dari variabel lingkungan
    if (apikey == validApiKey) {
      const chats = await this.client.getChats();
      const groups = chats
        .filter(chat => chat.isGroup)
        .map((group: Chat) => ({
          name: group.name,
          id: group.id._serialized,
        }));
      return groups;
    }
  }

  // Fungsi untuk mengirim pesan ke grup berdasarkan nama atau ID grup
  async sendMessageToGroup(groupNameOrId: string, message: string, apikey: string): Promise<Message | void> {
    const validApiKey = process.env.API_KEY; // Mengambil API key dari variabel lingkungan
    if (apikey == validApiKey) {
      const chats = await this.client.getChats();
      const group = chats.find(chat => chat.isGroup && (chat.name === groupNameOrId || chat.id._serialized === groupNameOrId));

      if (!group) {
        throw new Error(`Group with name or ID "${groupNameOrId}" not found`);
      }

      return await this.client.sendMessage(group.id._serialized, message);
    }
  }
}