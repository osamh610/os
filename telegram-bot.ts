import TelegramBot from 'node-telegram-bot-api';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8350973057:AAE9Aoj2TdLFo5_hP6e5OlD87NvY_9MelR8';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';

class TelegramBotService {
  private bot: TelegramBot;
  private startTime: Date;

  constructor() {
    this.bot = new TelegramBot(BOT_TOKEN);
    this.startTime = new Date();
    this.setupBot();
  }

  private setupBot() {
    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString() || '';
      
      const welcomeMessage = `
🤖 *Welcome to OSSMSBot!*

I'm your SMS gateway bot. Here's what I can do:

📱 *Receive SMS messages* and forward them to you instantly
📝 *Register your phone number* to receive SMS
🔔 *Get notifications* for all incoming messages
🆔 *Get your Chat ID* for SMS service integration
⚙️ *Manage your settings* with simple commands

*Available Commands:*
/help - Show this help message
/register - Register your phone number
/status - Check your registration status
/mychatid - Get your chat ID for SMS forwarding
/unregister - Remove your phone number
/settings - Configure notification preferences

To get started:
1. Use /mychatid to get your Chat ID
2. Use /register to link your phone number
      `;

      await this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Handle /help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      const helpMessage = `
📚 *OSSMSBot Commands*

🔰 *Basic Commands:*
/start - Welcome message and overview
/help - Show this help menu
/register - Register your phone number
/status - Check registration status
/mychatid - Get your chat ID for SMS forwarding

🔧 *Management Commands:*
/unregister - Remove phone number
/settings - Notification preferences
/history - View recent messages

📞 *Phone Registration:*
Use /register and follow the prompts to link your phone number. Once registered, you'll receive all SMS messages sent to that number.

🆔 *Chat ID for SMS Integration:*
Use /mychatid to get your unique chat ID. This ID is needed to configure SMS forwarding services to send messages directly to your Telegram.

🔐 *Security:*
Your phone number is securely stored and only used for SMS forwarding. Use /unregister anytime to remove it.

Need more help? Contact support: @admin
      `;

      await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });

    // Handle /register command
    this.bot.onText(/\/register/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString() || '';
      
      // Check if user is already registered
      const existingUser = await storage.getUserByTelegramId(telegramId);
      if (existingUser) {
        await this.bot.sendMessage(chatId, 
          `✅ You're already registered with phone number: ${existingUser.phoneNumber}\n\nUse /unregister to remove it or /settings to modify preferences.`
        );
        return;
      }

      const registerMessage = `
📱 *Phone Number Registration*

Please send your phone number in international format:
Examples:
• +1 555 123 4567 (US)
• +966 50 123 4567 (Saudi Arabia)
• +44 20 7946 0958 (UK)

Type your phone number or use /cancel to abort registration.
      `;

      await this.bot.sendMessage(chatId, registerMessage, { parse_mode: 'Markdown' });
      
      // Set up one-time listener for phone number
      this.setupPhoneNumberListener(chatId, telegramId);
    });

    // Handle /status command
    this.bot.onText(/\/status/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString() || '';
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        await this.bot.sendMessage(chatId, 
          "❌ You're not registered yet. Use /register to get started!"
        );
        return;
      }

      const messages = await storage.getMessagesByTelegramId(telegramId);
      const statusMessage = `
📊 *Your Registration Status*

✅ Status: Active
📱 Phone: ${user.phoneNumber}
📅 Registered: ${user.registrationDate?.toLocaleDateString()}
💬 Messages received: ${messages.length}

Use /unregister to remove registration or /settings for preferences.
      `;

      await this.bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
    });

    // Handle /mychatid command
    this.bot.onText(/\/mychatid/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString() || '';
      
      const chatIdMessage = `
🆔 *Your Chat ID Information*

**Chat ID:** \`${chatId}\`
**User ID:** \`${telegramId}\`

📋 *How to use this information:*

• Use your **Chat ID** (${chatId}) to configure SMS services
• This ID allows SMS providers to send messages directly to this chat
• Copy the Chat ID by tapping on it above

🔗 *For SMS Integration:*
Configure your SMS service (like Twilio, AWS SNS, etc.) to send webhook requests to our bot using this Chat ID as the recipient identifier.

⚠️ *Important:*
Keep your Chat ID secure and only share it with trusted SMS services. Anyone with this ID can potentially send messages to your Telegram chat.
      `;

      await this.bot.sendMessage(chatId, chatIdMessage, { parse_mode: 'Markdown' });
    });

    // Handle /unregister command
    this.bot.onText(/\/unregister/, async (msg) => {
      const chatId = msg.chat.id;
      const telegramId = msg.from?.id.toString() || '';
      
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) {
        await this.bot.sendMessage(chatId, "❌ You're not registered.");
        return;
      }

      // Create confirmation keyboard
      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Yes, unregister', callback_data: `unregister_confirm_${user.id}` },
              { text: '❌ Cancel', callback_data: 'unregister_cancel' }
            ]
          ]
        }
      };

      await this.bot.sendMessage(chatId, 
        `⚠️ *Confirm Unregistration*\n\nAre you sure you want to unregister phone number ${user.phoneNumber}?\n\nThis action cannot be undone.`,
        { parse_mode: 'Markdown', ...options }
      );
    });

    // Handle callback queries (inline keyboard responses)
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message?.chat.id;
      const data = query.data;

      if (!chatId || !data) return;

      if (data.startsWith('unregister_confirm_')) {
        const userId = data.replace('unregister_confirm_', '');
        await storage.deleteUser(userId);
        
        await this.bot.editMessageText(
          '✅ Successfully unregistered! Use /register to sign up again.',
          {
            chat_id: chatId,
            message_id: query.message?.message_id,
          }
        );
      } else if (data === 'unregister_cancel') {
        await this.bot.editMessageText(
          '❌ Unregistration cancelled.',
          {
            chat_id: chatId,
            message_id: query.message?.message_id,
          }
        );
      }

      await this.bot.answerCallbackQuery(query.id);
    });
  }

  private setupPhoneNumberListener(chatId: number, telegramId: string) {
    const phoneListener = async (msg: any) => {
      if (msg.chat.id !== chatId) return;
      
      const text = msg.text?.trim();
      
      if (text === '/cancel') {
        this.bot.removeListener('message', phoneListener);
        await this.bot.sendMessage(chatId, '❌ Registration cancelled.');
        return;
      }

      // Basic phone number validation
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(text)) {
        await this.bot.sendMessage(chatId, 
          '❌ Invalid phone number format. Please use international format like +1234567890 or use /cancel to abort.'
        );
        return;
      }

      try {
        const userData = insertUserSchema.parse({
          telegramId,
          telegramUsername: msg.from?.username || '',
          telegramName: `${msg.from?.first_name || ''} ${msg.from?.last_name || ''}`.trim(),
          phoneNumber: text,
        });

        await storage.createUser(userData);
        this.bot.removeListener('message', phoneListener);
        
        await this.bot.sendMessage(chatId, 
          `✅ *Registration Successful!*\n\nYour phone number ${text} has been registered.\nYou'll now receive all SMS messages sent to this number.\n\n🆔 *Your Chat ID:* \`${chatId}\`\n\nUse this Chat ID to configure SMS services to forward messages directly to this chat. Use /mychatid anytime to view this information again.`,
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        await this.bot.sendMessage(chatId, 
          '❌ Registration failed. Please try again or contact support.'
        );
      }
    };

    this.bot.on('message', phoneListener);
    
    // Remove listener after 5 minutes
    setTimeout(() => {
      this.bot.removeListener('message', phoneListener);
    }, 300000);
  }

  async sendSMSToTelegram(phoneNumber: string, messageContent: string): Promise<boolean> {
    try {
      // Find user by phone number
      const users = await storage.getAllUsers();
      const user = users.find(u => u.phoneNumber === phoneNumber);
      
      if (!user) {
        console.log(`No user found for phone number: ${phoneNumber}`);
        return false;
      }

      // Create message record
      await storage.createMessage({
        fromPhoneNumber: phoneNumber,
        toTelegramId: user.telegramId,
        content: messageContent,
        status: 'pending',
      });

      const chatId = parseInt(user.telegramId);
      const formattedMessage = `
📱 *New SMS Message*

From: ${phoneNumber}
Time: ${new Date().toLocaleString()}

Message:
${messageContent}
      `;

      await this.bot.sendMessage(chatId, formattedMessage, { parse_mode: 'Markdown' });
      
      // Update message status to delivered
      const messages = await storage.getAllMessages();
      const message = messages.find(m => 
        m.fromPhoneNumber === phoneNumber && 
        m.toTelegramId === user.telegramId && 
        m.content === messageContent
      );
      
      if (message) {
        await storage.updateMessageStatus(message.id, 'delivered');
      }

      return true;
    } catch (error) {
      console.error('Failed to send SMS to Telegram:', error);
      return false;
    }
  }

  async setWebhook(url: string): Promise<boolean> {
    try {
      await this.bot.setWebHook(url);
      return true;
    } catch (error) {
      console.error('Failed to set webhook:', error);
      return false;
    }
  }

  processUpdate(update: any): void {
    this.bot.processUpdate(update);
  }

  getBot(): TelegramBot {
    return this.bot;
  }

  getUptime(): string {
    const now = new Date();
    const diff = now.getTime() - this.startTime.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  }
}

export const telegramBotService = new TelegramBotService();
