import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
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
    const validApiKey = process.env.API_KEY; // Ambil API Key dari environment
    if (apikey !== validApiKey) {
      throw new HttpException({
        status: 'error',
        httpCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid API key',
      }, HttpStatus.UNAUTHORIZED); // 401 Unauthorized jika API key tidak cocok
    }

    // Validasi jika message kosong atau tidak valid
    if (!message || message.trim() === '') {
      throw new HttpException({
        status: 'error',
        httpCode: HttpStatus.BAD_REQUEST,
        message: 'Message cannot be empty or invalid',
      }, HttpStatus.BAD_REQUEST); // 400 Bad Request jika message kosong atau invalid
    }

    const chatId = `${number}@c.us`; // Format nomor telepon untuk WhatsApp
    try {
      await this.client.sendMessage(chatId, message);
      return {
        status: 'success',
        httpCode: HttpStatus.OK, // 200 OK
        message: `Message sent to ${number}`,
        data: { number, message }, // Berikan data yang berhasil dikirim
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw new HttpException({
        status: 'error',
        httpCode: HttpStatus.INTERNAL_SERVER_ERROR, // 500 Internal Server Error
        message: `Failed to send message to ${number}`,
        error: error.message, // Sertakan pesan error
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async sendImage(number: string, imageUrl: string, caption: string, apikey: string) {
    const validApiKey = process.env.API_KEY; // Ambil API Key dari environment
    // Validasi API Key
    if (apikey !== validApiKey) {
      throw new HttpException({
        status: 'error',
        httpCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid API key',
      }, HttpStatus.UNAUTHORIZED); // 401 Unauthorized jika API key tidak cocok
    }

    // Validasi jika caption kosong atau tidak valid
    if (!caption || caption.trim() === '') {
      throw new HttpException({
        status: 'error',
        httpCode: HttpStatus.BAD_REQUEST,
        message: 'Caption cannot be empty or invalid',
      }, HttpStatus.BAD_REQUEST); // 400 Bad Request jika caption kosong atau invalid
    }

    // Validasi URL gambar
    if (!imageUrl || !/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(imageUrl)) {
      throw new HttpException({
        status: 'error',
        httpCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid image URL format',
      }, HttpStatus.BAD_REQUEST); // 400 Bad Request jika URL gambar tidak valid
    }

    const chatId = `${number}@c.us`; // Format nomor telepon untuk WhatsApp

    try {
      // Download image
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      // Deteksi content-type dari gambar yang diunduh
      const contentType = response.headers['content-type'];
      const media = new MessageMedia(contentType, Buffer.from(response.data).toString('base64'));

      // Kirim gambar dengan caption
      await this.client.sendMessage(chatId, media, { caption });

      // Kembalikan respons sukses
      return {
        status: 'success',
        httpCode: HttpStatus.OK, // 200 OK
        message: `Image sent to ${number}`,
        data: { number, caption, imageUrl }, // Kembalikan data lengkap yang dikirim
      };
    } catch (error) {
      console.error('Error sending image:', error);

      // Kembalikan error yang lebih detail
      throw new HttpException({
        status: 'error',
        httpCode: HttpStatus.INTERNAL_SERVER_ERROR, // 500 Internal Server Error
        message: `Failed to send image to ${number}`,
        error: error.response ? error.response.data : error.message, // Sertakan pesan error lebih detail
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async checkSession(apikey: string): Promise<{ statusCode: number, message: string, data?: any }> {
    const validApiKey = process.env.API_KEY; // Mengambil API key dari environment variables

    // Validasi API Key
    if (apikey !== validApiKey) {
      throw new HttpException({
        status: 'error',
        httpCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid API key',
      }, HttpStatus.UNAUTHORIZED); // 401 Unauthorized jika API key tidak cocok
    }
    if (this.client.info && this.client.info.pushname) {
      return { 
        statusCode: HttpStatus.OK,  // Mengembalikan status HTTP 200
        message: 'WhatsApp session is connected',
        data: {
          pushname: this.client.info.pushname,
          phoneNumber: this.client.info.wid.user,
        }
      };
    } else {
      return { 
        statusCode: HttpStatus.BAD_REQUEST,  // Mengembalikan status HTTP 400
        message: 'WhatsApp session is not connected'
      };
    }
  }

  async getAllGroups(apikey: string): Promise<{ status: string; httpCode: number; message: string; data?: { name: string; id: string }[] }> {
    const validApiKey = process.env.API_KEY; // Mengambil API key dari environment variables

    // Validasi API Key
    if (apikey !== validApiKey) {
      throw new HttpException({
        status: 'error',
        httpCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid API key',
      }, HttpStatus.UNAUTHORIZED); // 401 Unauthorized jika API key tidak cocok
    }

    try {
      // Ambil semua chats
      const chats = await this.client.getChats();

      // Filter chats yang berupa grup
      const groups = chats
        .filter(chat => chat.isGroup)
        .map((group: Chat) => ({
          name: group.name,
          id: group.id._serialized,
        }));

      // Kembalikan response sukses
      return {
        status: 'success',
        httpCode: HttpStatus.OK, // 200 OK
        message: 'Groups retrieved successfully',
        data: groups,
      };
    } catch (error) {
      // Jika terjadi error, tangani dengan HttpException
      console.error('Error retrieving groups:', error);
      throw new HttpException({
        status: 'error',
        httpCode: HttpStatus.INTERNAL_SERVER_ERROR, // 500 Internal Server Error
        message: 'Failed to retrieve groups',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Fungsi untuk mengirim pesan ke grup berdasarkan nama atau ID grup
  async sendMessageToGroup(groupNameOrId: string, message: string, apikey: string): Promise<{ status: string; httpCode: number; message: string; data?: { groupName: string; messageId: string; message: string } }> {
    // Mengambil API key dari variabel lingkungan
    const validApiKey = process.env.API_KEY;

    // Cek validitas API key
    if (apikey !== validApiKey) {
      throw new HttpException(
        {
          status: 'error',
          httpCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid API key',
        },
        HttpStatus.UNAUTHORIZED
      ); // 401 Unauthorized jika API key tidak cocok
    }

    // Validasi message tidak kosong
    if (!message || message.trim() === '') {
      throw new HttpException(
        {
          status: 'error',
          httpCode: HttpStatus.BAD_REQUEST,
          message: 'Message cannot be empty',
        },
        HttpStatus.BAD_REQUEST
      ); // 400 Bad Request jika pesan kosong
    }

    // Dapatkan semua chat dan cari group berdasarkan nama atau ID
    const chats = await this.client.getChats();
    const group = chats.find(
      chat =>
        chat.isGroup &&
        (chat.name === groupNameOrId || chat.id._serialized === groupNameOrId)
    );

    // Jika group tidak ditemukan
    if (!group) {
      throw new HttpException(
        {
          status: 'error',
          httpCode: HttpStatus.NOT_FOUND,
          message: `Group with name or ID "${groupNameOrId}" not found`,
        },
        HttpStatus.NOT_FOUND
      ); // 404 Not Found jika grup tidak ditemukan
    }

    // Kirim pesan ke grup yang ditemukan
    try {
      const sentMessage = await this.client.sendMessage(group.id._serialized, message);
      return {
        status: 'success',
        httpCode: HttpStatus.OK, // 200 OK jika pesan berhasil dikirim
        message: `Message sent to group "${groupNameOrId}"`,
        data: {
          groupName: group.name,
          messageId: sentMessage.id._serialized,
          message: message
        },
      };
    } catch (error) {
      // Penanganan error saat pengiriman pesan
      throw new HttpException(
        {
          status: 'error',
          httpCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to send message to group "${groupNameOrId}"`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      ); // 500 Internal Server Error jika terjadi kesalahan
    }
  }
}