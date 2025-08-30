import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { telegramBotService } from "./services/telegram-bot";
import { smsService } from "./services/sms-service";
import { insertUserSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Telegram webhook endpoint
  app.post('/api/telegram/webhook', (req, res) => {
    try {
      telegramBotService.processUpdate(req.body);
      res.status(200).send('OK');
    } catch (error) {
      console.error('Telegram webhook error:', error);
      res.status(500).send('Error');
    }
  });

  // SMS webhook endpoint (for Twilio)
  app.post('/api/sms/webhook', async (req, res) => {
    try {
      const { From: from, Body: body } = req.body;
      await smsService.handleIncomingSMS(from, body);
      
      // Respond with TwiML
      res.type('text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>SMS received and forwarded to Telegram</Message>
        </Response>`);
    } catch (error) {
      console.error('SMS webhook error:', error);
      res.status(500).send('Error');
    }
  });

  // Dashboard API endpoints

  // Get dashboard stats
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getBotStats();
      const users = await storage.getAllUsers();
      const messages = await storage.getAllMessages();
      
      // Update real-time stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const messagesToday = messages.filter(m => m.timestamp && m.timestamp >= today).length;
      const deliveredCount = messages.filter(m => m.status === 'delivered').length;
      const successRate = messages.length > 0 ? ((deliveredCount / messages.length) * 100).toFixed(1) + '%' : '0%';
      
      const updatedStats = await storage.updateBotStats({
        totalUsers: users.length,
        messagesToday,
        messagesTotal: messages.length,
        successRate,
        activeSessions: users.filter(u => u.isActive).length,
        uptime: telegramBotService.getUptime(),
      });

      res.json(updatedStats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get stats' });
    }
  });

  // Get all users
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get users' });
    }
  });

  // Get user by ID
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Update user
  app.patch('/api/users/:id', async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Delete user
  app.delete('/api/users/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Get all messages
  app.get('/api/messages', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const messages = limit 
        ? await storage.getRecentMessages(limit)
        : await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get messages' });
    }
  });

  // Get messages for specific user
  app.get('/api/users/:telegramId/messages', async (req, res) => {
    try {
      const messages = await storage.getMessagesByTelegramId(req.params.telegramId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user messages' });
    }
  });

  // Send test SMS (for testing)
  app.post('/api/sms/send', async (req, res) => {
    try {
      const { to, message } = req.body;
      const success = await smsService.sendSMS(to, message);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: 'Failed to send SMS' });
    }
  });

  // Send message directly to Telegram chat ID
  app.post('/api/telegram/send', async (req, res) => {
    try {
      const { chatId, message, fromNumber } = req.body;
      
      if (!chatId || !message) {
        return res.status(400).json({ error: 'chatId and message are required' });
      }

      // Create message record
      await storage.createMessage({
        fromPhoneNumber: fromNumber || 'API',
        toTelegramId: chatId.toString(),
        content: message,
        status: 'pending',
      });

      const formattedMessage = `
📱 *New SMS Message*

From: ${fromNumber || 'External Service'}
Time: ${new Date().toLocaleString()}

Message:
${message}
      `;

      const telegramBot = telegramBotService.getBot();
      await telegramBot.sendMessage(chatId, formattedMessage, { parse_mode: 'Markdown' });

      // Update message status to delivered
      const messages = await storage.getAllMessages();
      const messageRecord = messages.find(m => 
        m.toTelegramId === chatId.toString() && 
        m.content === message
      );
      
      if (messageRecord) {
        await storage.updateMessageStatus(messageRecord.id, 'delivered');
      }

      res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
      console.error('Failed to send message to Telegram:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Get SMS service status
  app.get('/api/sms/status', async (req, res) => {
    try {
      const isConfigured = smsService.isConfigured();
      const balance = await smsService.getBalance();
      
      res.json({
        configured: isConfigured,
        balance: balance.balance || '0',
        currency: balance.currency || 'USD',
        provider: 'Twilio'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get SMS status' });
    }
  });

  // Setup webhooks
  app.post('/api/setup/webhooks', async (req, res) => {
    try {
      const domain = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const webhookUrl = `${protocol}://${domain}`;

      // Setup Telegram webhook
      const telegramSuccess = await telegramBotService.setWebhook(`${webhookUrl}/api/telegram/webhook`);
      
      // Setup SMS webhook
      const smsSuccess = await smsService.setupSMSWebhook(webhookUrl);

      res.json({
        telegram: telegramSuccess,
        sms: smsSuccess,
        webhookUrl
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to setup webhooks' });
    }
  });

  const httpServer = createServer(app);

  // Initialize webhooks on server start
  httpServer.on('listening', async () => {
    console.log('Setting up webhooks...');
    
    // Try to determine the webhook URL
    const domains = process.env.REPLIT_DOMAINS;
    if (domains) {
      const domain = domains.split(',')[0];
      const webhookUrl = `https://${domain}`;
      
      await telegramBotService.setWebhook(`${webhookUrl}/api/telegram/webhook`);
      await smsService.setupSMSWebhook(webhookUrl);
      
      console.log(`Webhooks configured for: ${webhookUrl}`);
    }
  });

  return httpServer;
}
