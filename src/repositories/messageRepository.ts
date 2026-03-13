import { eq, and, desc, or, SQL } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { messages } from "@/db";
import type { messages as MessagesTable } from "@/db";
import * as schema from "@/db";
import { sql } from "drizzle-orm";
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 类型推断
type Message = typeof MessagesTable.$inferSelect;
type InsertMessage = typeof MessagesTable.$inferInsert;
type UpdateMessage = Partial<InsertMessage>;

/**
 * 智能预翻译：自动生成常用语言翻译
 */
async function generateSmartTranslations(
  title: string,
  content: string,
  senderLanguage: string
): Promise<Record<string, { title?: string; content?: string }>> {
  try {
    const config = new Config();
    const client = new LLMClient(config);

    // 语言名称映射
    const langNames: Record<string, string> = {
      'zh': 'Chinese (Simplified)',
      'en': 'English',
      'ja': 'Japanese',
      'ko': 'Korean',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic',
    };

    // 预翻译策略：总是翻译中英文（最常用）
    const targetLanguages = ['zh', 'en'];
    const translations: Record<string, { title?: string; content?: string }> = {};

    // 并行翻译目标语言
    await Promise.all(
      targetLanguages.map(async (lang) => {
        // 如果发送者语言就是目标语言，跳过翻译
        if (lang === senderLanguage) {
          return;
        }

        const targetLanguageName = langNames[lang] || 'English';

        const systemPrompt = `You are a professional translator.
Your task is to translate the given text to ${targetLanguageName}.
Only return the translated text, no explanations, no notes, no additional content.
Preserve the original formatting and structure.
If the text is already in the target language, return it as-is.`;

        // 翻译标题
        const titleResponse = await client.invoke([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: title },
        ], { temperature: 0.3 });

        // 翻译内容
        const contentResponse = await client.invoke([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content },
        ], { temperature: 0.3 });

        translations[lang] = {
          title: titleResponse.content,
          content: contentResponse.content,
        };
      })
    );

    return translations;
  } catch (error) {
    console.error('[Smart Translation] Failed to generate translations:', error);
    return {};
  }
}

export class MessageRepository {
  /**
   * 创建消息（使用实际数据库表结构）
   */
  async createMessage(data: any): Promise<any> {
    const db = await getDb(schema);

    // 获取发送者语言（默认为英文）
    const senderLanguage = data.language || data.senderLanguage || 'en';
    const messageTitle = data.subject || data.title || '';
    const messageContent = data.content || '';

    // 智能预翻译：自动生成常用语言翻译
    let translations: Record<string, { title?: string; content?: string }> = {};
    if (messageContent && messageTitle) {
      translations = await generateSmartTranslations(messageTitle, messageContent, senderLanguage);
    }

    // 转换数据格式以匹配实际表结构
    const messageData = {
      userId: data.userId || data.fromUserId,
      type: data.type || 'inquiry',
      folder: data.folder || 'sent',
      title: messageTitle,
      content: messageContent,
      language: senderLanguage,  // 保存发送者语言
      translations: translations,  // 保存预翻译结果
      senderId: data.senderId || data.fromUserId,
      senderName: data.senderName || data.fromUserName,
      senderAddress: data.senderAddress || data.fromUserId,
      recipientId: data.recipientId || data.toUserId,
      recipientName: data.recipientName || data.toUserName,
      recipientAddress: data.recipientAddress || data.toUserId,
      productId: data.productId || null,
      productName: data.productName || null,
      cas: data.cas || null,
      quantity: data.quantity || null,
      status: data.status || 'sent',
      unread: data.unread !== undefined ? data.unread : false,
      starred: data.starred || false,
      deleted: data.deleted || false,
      archived: data.archived || false,
      replyContent: data.replyContent || null,
      replyFrom: data.replyFrom || null,
      replyAddress: data.replyAddress || null,
      replyContact: data.replyContact || null,
      attachments: data.attachments || [],
      autoSavedAt: data.autoSavedAt || null,
      createdAt: data.createdAt || new Date().toISOString(),
      sentAt: data.sentAt || new Date().toISOString(),
      readAt: data.readAt || null,
    };

    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  /**
   * 获取用户的消息列表（根据文件夹）
   */
  async getMessagesByFolder(userId: string, folder: string): Promise<any[]> {
    const db = await getDb(schema);

    let query: SQL<unknown> | string = '';
    switch (folder) {
      case 'inbox':
        // 收到的消息
        query = sql`
          SELECT
            id, user_id as "userId", type, folder, title, content, language, translations,
            sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
            recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
            product_id as "productId", product_name as "productName", cas, quantity,
            status, unread, starred, deleted, archived,
            reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
            attachments, auto_saved_at as "autoSavedAt",
            created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
          FROM messages
          WHERE recipient_id = ${userId} AND deleted = false AND type != 'draft'
          ORDER BY created_at DESC
        `;
        break;
      case 'sent':
      case 'inquiries':
        // 发送的消息
        query = sql`
          SELECT
            id, user_id as "userId", type, folder, title, content, language, translations,
            sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
            recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
            product_id as "productId", product_name as "productName", cas, quantity,
            status, unread, starred, deleted, archived,
            reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
            attachments, auto_saved_at as "autoSavedAt",
            created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
          FROM messages
          WHERE sender_id = ${userId} AND deleted = false
          ORDER BY created_at DESC
        `;
        break;
      case 'drafts':
        // 草稿（status = pending）
        query = sql`
          SELECT
            id, user_id as "userId", type, folder, title, content, language, translations,
            sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
            recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
            product_id as "productId", product_name as "productName", cas, quantity,
            status, unread, starred, deleted, archived,
            reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
            attachments,
            auto_saved_at as "autoSavedAt",
            created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
          FROM messages
          WHERE sender_id = ${userId} AND status = 'pending' AND deleted = false
          ORDER BY created_at DESC
        `;
        break;
      case 'trash':
        // 已删除
        query = sql`
          SELECT
            id, user_id as "userId", type, folder, title, content, language, translations,
            sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
            recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
            product_id as "productId", product_name as "productName", cas, quantity,
            status, unread, starred, deleted, archived,
            reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
            attachments,
            auto_saved_at as "autoSavedAt",
            created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
          FROM messages
          WHERE (sender_id = ${userId} OR recipient_id = ${userId}) AND deleted = true
          ORDER BY created_at DESC
        `;
        break;
      case 'archive':
        // 已归档
        query = sql`
          SELECT
            id, user_id as "userId", type, folder, title, content, language, translations,
            sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
            recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
            product_id as "productId", product_name as "productName", cas, quantity,
            status, unread, starred, deleted, archived,
            reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
            attachments,
            auto_saved_at as "autoSavedAt",
            created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
          FROM messages
          WHERE (sender_id = ${userId} OR recipient_id = ${userId}) AND archived = true AND deleted = false
          ORDER BY created_at DESC
        `;
        break;
      default:
        query = sql`
          SELECT
            id, user_id as "userId", type, folder, title, content,
            sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
            recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
            product_id as "productId", product_name as "productName", cas, quantity,
            status, unread, starred, deleted, archived,
            reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
            auto_saved_at as "autoSavedAt",
            created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
          FROM messages
          WHERE recipient_id = ${userId}
          ORDER BY created_at DESC
        `;
    }

    const result = await db.execute(query);
    return result.rows as any[];
  }

  /**
   * 获取用户发送的消息列表
   */
  async getSentMessages(userId: string): Promise<Message[]> {
    const db = await getDb(schema);
    const query = sql`
      SELECT
        id, user_id as "userId", type, folder, title, content, language, translations,
        sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
        recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
        product_id as "productId", product_name as "productName", cas, quantity,
        status, unread, starred, deleted, archived,
        reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
        attachments,
        auto_saved_at as "autoSavedAt",
        created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
      FROM messages
      WHERE sender_id = ${userId} AND deleted = false AND archived = false AND type != 'draft'
      ORDER BY created_at DESC
    `;
    const result = await db.execute(query);
    return result.rows as Message[];
  }

  /**
   * 获取收到的消息列表
   */
  async getReceivedMessages(userId: string): Promise<Message[]> {
    const db = await getDb(schema);
    const query = sql`
      SELECT
        id, user_id as "userId", type, folder, title, content, language, translations,
        sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
        recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
        product_id as "productId", product_name as "productName", cas, quantity,
        status, unread, starred, deleted, archived,
        reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
        attachments,
        auto_saved_at as "autoSavedAt",
        created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
      FROM messages
      WHERE recipient_id = ${userId} AND deleted = false AND archived = false AND type != 'draft' AND folder != 'inquiries'
      ORDER BY created_at DESC
    `;
    const result = await db.execute(query);
    return result.rows as Message[];
  }

  /**
   * 获取草稿消息
   */
  async getDrafts(userId: string): Promise<Message[]> {
    const db = await getDb(schema);
    const query = sql`
      SELECT
        id, user_id as "userId", type, folder, title, content, language, translations,
        sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
        recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
        product_id as "productId", product_name as "productName", cas, quantity,
        status, unread, starred, deleted, archived,
        reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
        attachments,
        auto_saved_at as "autoSavedAt",
        created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
      FROM messages
      WHERE sender_id = ${userId} AND status = 'pending' AND deleted = false
      ORDER BY created_at DESC
    `;
    const result = await db.execute(query);
    return result.rows as Message[];
  }

  /**
   * 获取已删除消息
   */
  async getDeletedMessages(userId: string): Promise<Message[]> {
    const db = await getDb(schema);
    const query = sql`
      SELECT
        id, user_id as "userId", type, folder, title, content, language, translations,
        sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
        recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
        product_id as "productId", product_name as "productName", cas, quantity,
        status, unread, starred, deleted, archived,
        reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
        attachments,
        auto_saved_at as "autoSavedAt",
        created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
      FROM messages
      WHERE (sender_id = ${userId} OR recipient_id = ${userId}) AND folder = 'trash'
      ORDER BY created_at DESC
    `;
    const result = await db.execute(query);
    return result.rows as Message[];
  }

  /**
   * 获取已归档消息
   */
  async getArchivedMessages(userId: string): Promise<Message[]> {
    const db = await getDb(schema);
    const query = sql`
      SELECT
        id, user_id as "userId", type, folder, title, content, language, translations,
        sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
        recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
        product_id as "productId", product_name as "productName", cas, quantity,
        status, unread, starred, deleted, archived,
        reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
        attachments,
        auto_saved_at as "autoSavedAt",
        created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
      FROM messages
      WHERE (sender_id = ${userId} OR recipient_id = ${userId}) AND archived = true AND deleted = false
      ORDER BY created_at DESC
    `;
    const result = await db.execute(query);
    return result.rows as Message[];
  }

  /**
   * 获取消息详情
   */
  async getMessageById(id: string): Promise<Message | null> {
    const db = await getDb(schema);
    const query = sql`
      SELECT * FROM messages
      WHERE id = ${id}
      LIMIT 1
    `;
    const result = await db.execute(query);
    return result.rows.length > 0 ? result.rows[0] as Message : null;
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(id: string): Promise<Message | null> {
    const db = await getDb(schema);
    const [message] = await db
      .update(messages)
      .set({ unread: false, readAt: new Date().toISOString() })
      .where(eq(messages.id, id))
      .returning();
    return message || null;
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    const db = await getDb(schema);
    const result = await db
      .select({ count: messages.id })
      .from(messages)
      .where(and(eq(messages.recipientId, userId), eq(messages.unread, true)));
    return result.length;
  }

  /**
   * 获取两个用户之间的所有对话消息
   */
  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    const db = await getDb(schema);
    return db.query.messages.findMany({
      where: or(
        and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
      ),
      orderBy: [desc(messages.createdAt)],
    });
  }

  /**
   * 获取询价消息列表（从产品中心发来的询价）
   */
  async getInquiryMessages(userId: string): Promise<Message[]> {
    const db = await getDb(schema);
    const query = sql`
      SELECT
        id, user_id as "userId", type, folder, title, content, language, translations,
        sender_id as "senderId", sender_name as "senderName", sender_address as "senderAddress",
        recipient_id as "recipientId", recipient_name as "recipientName", recipient_address as "recipientAddress",
        product_id as "productId", product_name as "productName", cas, quantity,
        status, unread, starred, deleted, archived,
        reply_content as "replyContent", reply_from as "replyFrom", reply_address as "replyAddress", reply_contact as "replyContact",
        attachments,
        auto_saved_at as "autoSavedAt",
        created_at as "createdAt", sent_at as "sentAt", read_at as "readAt"
      FROM messages
      WHERE recipient_id = ${userId} AND deleted = false AND archived = false AND type = 'inquiry'
      ORDER BY created_at DESC
    `;
    const result = await db.execute(query);
    return result.rows as Message[];
  }

  /**
   * 删除消息
   */
  async deleteMessage(id: string): Promise<boolean> {
    const db = await getDb(schema);
    const result = await db.update(messages)
      .set({ deleted: true })
      .where(eq(messages.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const messageRepository = new MessageRepository();
