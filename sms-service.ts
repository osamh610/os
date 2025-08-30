import twilio from 'twilio';
import { telegramBotService } from './telegram-bot';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

class SMSService {
  private twilioClient: any;

  constructor() {
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    }
  }

  async setupSMSWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.twilioClient) {
      console.log('Twilio not configured, SMS webhook setup skipped');
      return false;
    }

    try {
      // Configure webhook for incoming SMS
      await this.twilioClient.incomingPhoneNumbers.list()
        .then((phoneNumbers: any[]) => {
          phoneNumbers.forEach(async (number) => {
            await this.twilioClient.incomingPhoneNumbers(number.sid)
              .update({
                smsUrl: `${webhookUrl}/api/sms/webhook`,
                smsMethod: 'POST'
              });
          });
        });
      
      console.log('SMS webhook configured successfully');
      return true;
    } catch (error) {
      console.error('Failed to setup SMS webhook:', error);
      return false;
    }
  }

  async handleIncomingSMS(from: string, body: string): Promise<boolean> {
    try {
      // Forward SMS to Telegram
      const success = await telegramBotService.sendSMSToTelegram(from, body);
      console.log(`SMS forwarded from ${from}: ${success ? 'success' : 'failed'}`);
      return success;
    } catch (error) {
      console.error('Error handling incoming SMS:', error);
      return false;
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.twilioClient) {
      console.log('Twilio not configured, cannot send SMS');
      return false;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: TWILIO_PHONE_NUMBER,
        to: to
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
  }

  getBalance(): Promise<any> {
    if (!this.twilioClient) {
      return Promise.resolve({ balance: '0', currency: 'USD' });
    }

    return this.twilioClient.balance.fetch()
      .then((balance: any) => balance)
      .catch(() => ({ balance: '0', currency: 'USD' }));
  }
}

export const smsService = new SMSService();
