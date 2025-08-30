import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  telegramId: text("telegram_id").notNull().unique(),
  telegramUsername: text("telegram_username"),
  telegramName: text("telegram_name"),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").default(true),
  registrationDate: timestamp("registration_date").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromPhoneNumber: text("from_phone_number").notNull(),
  toTelegramId: text("to_telegram_id").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull(), // 'pending', 'delivered', 'failed'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const botStats = pgTable("bot_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalUsers: integer("total_users").default(0),
  messagesToday: integer("messages_today").default(0),
  messagesTotal: integer("messages_total").default(0),
  successRate: text("success_rate").default("0"),
  activeSessions: integer("active_sessions").default(0),
  uptime: text("uptime").default("0s"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  telegramId: true,
  telegramUsername: true,
  telegramName: true,
  phoneNumber: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  fromPhoneNumber: true,
  toTelegramId: true,
  content: true,
  status: true,
});

export const insertBotStatsSchema = createInsertSchema(botStats).pick({
  totalUsers: true,
  messagesToday: true,
  messagesTotal: true,
  successRate: true,
  activeSessions: true,
  uptime: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertBotStats = z.infer<typeof insertBotStatsSchema>;
export type BotStats = typeof botStats.$inferSelect;

// API Response Types
export interface SMSStatusResponse {
  configured: boolean;
  balance: string;
  currency: string;
  provider: string;
}
