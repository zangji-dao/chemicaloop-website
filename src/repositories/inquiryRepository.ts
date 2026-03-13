import { eq, and, desc, SQL } from "drizzle-orm";
import { getDb } from "coze-coding-dev-sdk";
import { inquiries } from "@/db";
import * as schema from "@/db";

// 类型推断
type Inquiry = typeof inquiries.$inferSelect;
type InsertInquiry = typeof inquiries.$inferInsert;
type UpdateInquiry = Partial<InsertInquiry>;

export class InquiryRepository {
  /**
   * 创建询价
   */
  async createInquiry(data: InsertInquiry): Promise<Inquiry> {
    const db = await getDb(schema);
    const [inquiry] = await db.insert(inquiries).values(data).returning();
    return inquiry;
  }

  /**
   * 获取用户的询价列表
   */
  async getUserInquiries(userId: string): Promise<Inquiry[]> {
    const db = await getDb(schema);
    return db.query.inquiries.findMany({
      where: eq(inquiries.userId, userId),
      orderBy: [desc(inquiries.createdAt)],
    });
  }

  /**
   * 获取询价详情
   */
  async getInquiryById(id: string): Promise<Inquiry | null> {
    const db = await getDb(schema);
    const inquiry = await db.query.inquiries.findFirst({
      where: eq(inquiries.id, id),
    });
    return inquiry || null;
  }

  /**
   * 回复询价
   */
  async replyToInquiry(
    id: string,
    replyData: UpdateInquiry
  ): Promise<Inquiry | null> {
    const db = await getDb(schema);
    const [inquiry] = await db
      .update(inquiries)
      .set({
        ...replyData,
        status: "replied",
        repliedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(inquiries.id, id))
      .returning();
    return inquiry || null;
  }

  /**
   * 更新询价状态
   */
  async updateInquiryStatus(
    id: string,
    status: "pending" | "replied" | "completed"
  ): Promise<Inquiry | null> {
    const db = await getDb(schema);
    const [inquiry] = await db
      .update(inquiries)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(inquiries.id, id))
      .returning();
    return inquiry || null;
  }

  /**
   * 删除询价
   */
  async deleteInquiry(id: string): Promise<boolean> {
    const db = await getDb(schema);
    const result = await db.delete(inquiries).where(eq(inquiries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 获取所有待回复的询价（管理员/供应商用）
   */
  async getPendingInquiries(): Promise<Inquiry[]> {
    const db = await getDb(schema);
    return db.query.inquiries.findMany({
      where: eq(inquiries.status, "pending"),
      orderBy: [desc(inquiries.createdAt)],
    });
  }
}

export const inquiryRepository = new InquiryRepository();
