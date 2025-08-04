const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
  }

  async initialize() {
    try {
      console.log('=== Initializing WhatsApp Service ===');
      this.client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      this.client.on('qr', (qr) => {
        console.log('=== QR CODE RECEIVED ===');
        console.log('QR Code Data:', qr);
        console.log('Please scan this QR code with WhatsApp to authenticate:');
        qrcode.generate(qr, { small: true });
        console.log('=== END QR CODE ===');
        this.qrCode = qr;
        console.log('QR Code stored in service:', this.qrCode);
      });

      this.client.on('ready', () => {
        console.log('=== WhatsApp client is ready! ===');
        this.isReady = true;
      });

      this.client.on('authenticated', () => {
        console.log('=== WhatsApp client is authenticated! ===');
      });

      this.client.on('auth_failure', (msg) => {
        console.error('=== WhatsApp authentication failed ===');
        console.error('Error:', msg);
      });

      this.client.on('disconnected', (reason) => {
        console.log('=== WhatsApp client disconnected ===');
        console.log('Reason:', reason);
        this.isReady = false;
      });

      await this.client.initialize();
      console.log('=== WhatsApp Service initialization completed ===');
    } catch (error) {
      console.error('=== Error initializing WhatsApp client ===');
      console.error('Error:', error);
      throw error;
    }
  }

  async sendAttendanceNotification(parentPhone, studentName, status, date) {
    try {
      console.log('=== WhatsApp Notification Attempt ===');
      console.log('Parent Phone:', parentPhone);
      console.log('Student Name:', studentName);
      console.log('Status:', status);
      console.log('Date:', date);
      console.log('Client Ready:', this.isReady);
      console.log('Client Exists:', !!this.client);

      if (!this.isReady || !this.client) {
        console.warn('WhatsApp client not ready, skipping notification');
        return false;
      }

      // Format phone number (remove + and add country code if needed)
      let formattedPhone = parentPhone.replace(/\+/g, '');
      if (!formattedPhone.startsWith('91')) {
        formattedPhone = '91' + formattedPhone;
      }
      formattedPhone = formattedPhone + '@c.us';
      
      console.log('Formatted Phone:', formattedPhone);

      const statusText = status === 'present' ? 'present' : 
                        status === 'absent' ? 'absent' : 
                        status === 'late' ? 'late' : 'marked';

      const message = `📚 *Attendance Update*\n\n` +
                     `Dear Parent,\n\n` +
                     `Your child *${studentName}*'s attendance has been marked as *${statusText.toUpperCase()}* for ${date}.\n\n` +
                     `Thank you,\nSchool Management System`;

      console.log('Message to send:', message);

      const result = await this.client.sendMessage(formattedPhone, message);
      console.log('WhatsApp message sent successfully:', result);
      console.log(`WhatsApp notification sent to ${parentPhone} for ${studentName}`);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      hasClient: !!this.client,
      status: this.isReady ? 'ready' : 'not_ready',
      qrCode: this.qrCode
    };
  }
}

module.exports = new WhatsAppService();