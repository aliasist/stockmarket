import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"

// ── Chatbot Conversations ─────────────────────────────────────────────
export const chatbotConversations = sqliteTable("chatbot_conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id"),
  createdAt: text("created_at").notNull(),
  title: text("title"),
})

export const insertChatbotConversationSchema = createInsertSchema(chatbotConversations)
export type InsertChatbotConversation = Omit<typeof chatbotConversations.$inferInsert, "id">
export type ChatbotConversation = typeof chatbotConversations.$inferSelect

// ── Chatbot Messages ──────────────────────────────────────────────────
export const chatbotMessages = sqliteTable("chatbot_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull(),
  sender: text("sender").notNull(), // 'user' | 'bot'
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
})

export const insertChatbotMessageSchema = createInsertSchema(chatbotMessages)
export type InsertChatbotMessage = Omit<typeof chatbotMessages.$inferInsert, "id">
export type ChatbotMessage = typeof chatbotMessages.$inferSelect
