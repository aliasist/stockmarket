import { saveChatbotConversation, saveChatbotMessage } from "../cloudflareService";
import { NextFunction, Request, Response } from "express";

// POST /api/chatbot/conversation
export async function createConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, title } = req.body;
    const createdAt = new Date().toISOString();
    await saveChatbotConversation({ userId, createdAt, title });
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/chatbot/message
export async function addMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { conversationId, sender, content } = req.body;
    const createdAt = new Date().toISOString();
    await saveChatbotMessage({ conversationId, sender, content, createdAt });
    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
}
