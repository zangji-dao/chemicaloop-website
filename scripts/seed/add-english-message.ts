import { assertDevEnvironment } from '../lib/env-check';
assertDevEnvironment();

import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';

// 当前用户ID
const currentUserId = 'c4ca4238-a0b9-2382-0dcc-509a6f75849b';

// 英文测试消息（较长内容，便于测试翻译）
const englishMessage = {
  id: 'inbox-en-test-translation',
  user_id: currentUserId,
  type: 'inquiry',
  folder: 'inbox',
  title: 'Product Inquiry - Sulfuric Acid',
  content: `Dear Sir/Madam,

We are interested in purchasing Sulfuric Acid for our chemical manufacturing facility in Texas. Could you please provide a quotation for the following specifications:

Product: Sulfuric Acid (H2SO4)
Purity: ≥98%
Concentration: 98%
Packaging: 35kg HDPE drums
Quantity: 10,000 kg
Delivery Terms: CIF Houston Port
Payment Terms: 30% deposit by T/T, balance against BL copy

We require MSDS and quality certificates with the shipment. Please also provide information about your production capacity and lead time.

If you have any questions or need additional information, please do not hesitate to contact us.

Best regards,
Michael Johnson
Purchasing Manager
Texas Chemical Corp
Email: m.johnson@texaschemical.com
Phone: +1-555-123-4567`,
  language: 'en',
  translations: {},
  sender_id: null,
  sender_name: 'Michael Johnson',
  sender_address: 'm.johnson@texaschemical.com',
  recipient_id: currentUserId,
  recipient_name: 'Normal User',
  recipient_address: 'user@company.com',
  product_name: 'Sulfuric Acid',
  cas: '7664-93-9',
  quantity: '10,000 kg',
  status: 'sent',
  unread: true,
  starred: false,
  deleted: false,
  archived: false,
  attachments: [],
  created_at: new Date().toISOString(),
  sent_at: new Date().toISOString(),
  read_at: null
};

async function main() {
  try {
    console.log('📨 Adding English test message for translation testing...');

    const db = await getDb();

    // 检查消息是否已存在
    const existingQuery = sql`
      SELECT id FROM messages WHERE id = ${englishMessage.id}
    `;
    const existing = await db.execute(existingQuery);

    if (existing.rows.length > 0) {
      console.log('⏭️  Message already exists, deleting first...');
      const deleteQuery = sql`DELETE FROM messages WHERE id = ${englishMessage.id}`;
      await db.execute(deleteQuery);
    }

    // 插入新消息
    const insertQuery = sql`
      INSERT INTO messages (
        id, user_id, type, folder, title, content,
        language, translations,
        sender_id, sender_name, sender_address,
        recipient_id, recipient_name, recipient_address,
        product_name, cas, quantity,
        status, unread, starred, deleted, archived,
        attachments, created_at, sent_at, read_at
      ) VALUES (
        ${englishMessage.id}, ${englishMessage.user_id}, ${englishMessage.type}, ${englishMessage.folder},
        ${englishMessage.title}, ${englishMessage.content},
        ${englishMessage.language}, ${JSON.stringify(englishMessage.translations)},
        ${englishMessage.sender_id}, ${englishMessage.sender_name}, ${englishMessage.sender_address},
        ${englishMessage.recipient_id}, ${englishMessage.recipient_name}, ${englishMessage.recipient_address},
        ${englishMessage.product_name}, ${englishMessage.cas}, ${englishMessage.quantity},
        ${englishMessage.status}, ${englishMessage.unread}, ${englishMessage.starred}, ${englishMessage.deleted}, ${englishMessage.archived},
        ${JSON.stringify(englishMessage.attachments)}, ${englishMessage.created_at}, ${englishMessage.sent_at}, ${englishMessage.read_at}
      )
    `;

    await db.execute(insertQuery);
    console.log('✅ Successfully created English test message');
    console.log(`\n📝 Message details:`);
    console.log(`   ID: ${englishMessage.id}`);
    console.log(`   Title: ${englishMessage.title}`);
    console.log(`   Language: ${englishMessage.language}`);
    console.log(`   Content length: ${englishMessage.content.length} characters`);
    console.log(`   Unread: ${englishMessage.unread}`);

  } catch (error: any) {
    console.error('❌ Error creating English test message:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
