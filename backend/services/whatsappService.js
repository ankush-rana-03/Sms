const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
  }

  async initialize() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      this.client.on('qr', (qr) => {
        console.log('QR RECEIVED', qr);
        qrcode.generate(qr, { small: true });
      });

      this.client.on('ready', () => {
        console.log('WhatsApp client is ready!');
        this.isReady = true;
      });

      this.client.on('authenticated', () => {
        console.log('WhatsApp client is authenticated!');
      });

      this.client.on('auth_failure', (msg) => {
        console.error('WhatsApp authentication failed:', msg);
      });

      await this.client.initialize();
    } catch (error) {
      console.error('Error initializing WhatsApp client:', error);
      throw error;
    }
  }

  async sendAttendanceNotification(parentPhone, studentName, status, date) {
    try {
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

      const statusText = status === 'present' ? 'present' : 
                        status === 'absent' ? 'absent' : 
                        status === 'late' ? 'late' : 'marked';

      const message = `📚 *Attendance Update*\n\n` +
                     `Dear Parent,\n\n` +
                     `Your child *${studentName}*'s attendance has been marked as *${statusText.toUpperCase()}* for ${date}.\n\n` +
                     `Thank you,\nSchool Management System`;

      await this.client.sendMessage(formattedPhone, message);
      console.log(`WhatsApp notification sent to ${parentPhone} for ${studentName}`);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
    }
  }
}

module.exports = new WhatsAppService();