import { type User, type InsertUser, type Message, type InsertMessage, type BotStats, type InsertBotStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  // Message operations
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByTelegramId(telegramId: string): Promise<Message[]>;
  getAllMessages(): Promise<Message[]>;
  getRecentMessages(limit?: number): Promise<Message[]>;
  updateMessageStatus(id: string, status: string): Promise<Message | undefined>;

  // Bot stats operations
  getBotStats(): Promise<BotStats | undefined>;
  updateBotStats(stats: Partial<BotStats>): Promise<BotStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messages: Map<string, Message>;
  private botStats: BotStats | undefined;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.initializeBotStats();
  }

  private initializeBotStats() {
    this.botStats = {
      id: randomUUID(),
      totalUsers: 0,
      messagesToday: 0,
      messagesTotal: 0,
      successRate: "0",
      activeSessions: 0,
      uptime: "0s",
      lastUpdated: new Date(),
    };
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.telegramId === telegramId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      isActive: true,
      registrationDate: new Date(),
      telegramUsername: insertUser.telegramUsername || null,
      telegramName: insertUser.telegramName || null,
      phoneNumber: insertUser.phoneNumber || null,
    };
    this.users.set(id, user);
    
    // Update bot stats
    if (this.botStats) {
      this.botStats.totalUsers = this.users.size;
      this.botStats.lastUpdated = new Date();
    }
    
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      new Date(b.registrationDate || 0).getTime() - new Date(a.registrationDate || 0).getTime()
    );
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = this.users.delete(id);
    if (deleted && this.botStats) {
      this.botStats.totalUsers = this.users.size;
      this.botStats.lastUpdated = new Date();
    }
    return deleted;
  }

  // Message operations
  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = { 
      ...insertMessage, 
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    
    // Update bot stats
    if (this.botStats) {
      this.botStats.messagesTotal = this.messages.size;
      // Count today's messages
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      this.botStats.messagesToday = Array.from(this.messages.values()).filter(
        msg => msg.timestamp && msg.timestamp >= today
      ).length;
      
      // Calculate success rate
      const deliveredCount = Array.from(this.messages.values()).filter(
        msg => msg.status === 'delivered'
      ).length;
      this.botStats.successRate = this.messages.size > 0 
        ? ((deliveredCount / this.messages.size) * 100).toFixed(1) + '%'
        : '0%';
      
      this.botStats.lastUpdated = new Date();
    }
    
    return message;
  }

  async getMessagesByTelegramId(telegramId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.toTelegramId === telegramId)
      .sort((a, b) => 
        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      );
  }

  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => 
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
  }

  async getRecentMessages(limit: number = 10): Promise<Message[]> {
    const messages = await this.getAllMessages();
    return messages.slice(0, limit);
  }

  async updateMessageStatus(id: string, status: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, status };
    this.messages.set(id, updatedMessage);
    
    // Update success rate in bot stats
    if (this.botStats) {
      const deliveredCount = Array.from(this.messages.values()).filter(
        msg => msg.status === 'delivered'
      ).length;
      this.botStats.successRate = this.messages.size > 0 
        ? ((deliveredCount / this.messages.size) * 100).toFixed(1) + '%'
        : '0%';
      this.botStats.lastUpdated = new Date();
    }
    
    return updatedMessage;
  }

  // Bot stats operations
  async getBotStats(): Promise<BotStats | undefined> {
    return this.botStats;
  }

  async updateBotStats(stats: Partial<BotStats>): Promise<BotStats> {
    if (!this.botStats) {
      this.initializeBotStats();
    }
    this.botStats = { ...this.botStats!, ...stats, lastUpdated: new Date() };
    return this.botStats;
  }
}

export const storage = new MemStorage();
