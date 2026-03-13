import { assertDevEnvironment } from '../lib/env-check';
assertDevEnvironment();

import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';

// 当前用户ID
const currentUserId = 'c4ca4238-a0b9-2382-0dcc-509a6f75849b';

// 多语言 Inbox 消息
const inboxMessages = [
  // 英文消息
  {
    id: 'inbox-en-1',
    user_id: currentUserId,
    type: 'inquiry',
    folder: 'inbox',
    title: 'Acetone Quote Request',
    content: 'Dear Sir/Madam,\n\nWe would like to request a quote for acetone ≥99.5%. \n\nQuantity: 5000 kg\nDelivery: FOB Shanghai\n\nPlease provide your best offer.',
    language: 'en',
    translations: {},
    sender_id: null,
    sender_name: 'John Smith',
    sender_address: 'john.smith@chemical-us.com',
    recipient_id: currentUserId,
    recipient_name: 'Normal User',
    recipient_address: 'user@company.com',
    product_name: 'Acetone',
    cas: '67-64-1',
    quantity: '5000 kg',
    status: 'sent',
    unread: false,
    starred: false,
    deleted: false,
    archived: false,
    attachments: [],
    created_at: new Date().toISOString(),
    sent_at: new Date().toISOString(),
    read_at: new Date().toISOString()
  },
  // 中文消息
  {
    id: 'inbox-zh-1',
    user_id: currentUserId,
    type: 'inquiry',
    folder: 'inbox',
    title: '甲醇询价',
    content: '尊敬的供应商：\n\n我们需要询价甲醇≥99.9%。\n\n数量：3000升\n交货：上海港\n\n请提供最优报价。',
    language: 'zh',
    translations: {},
    sender_id: null,
    sender_name: '张三',
    sender_address: 'zhangsan@chemical-cn.com',
    recipient_id: currentUserId,
    recipient_name: 'Normal User',
    recipient_address: 'user@company.com',
    product_name: '甲醇',
    cas: '67-56-1',
    quantity: '3000L',
    status: 'sent',
    unread: false,
    starred: true,
    deleted: false,
    archived: false,
    attachments: [],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  // 日文消息
  {
    id: 'inbox-ja-1',
    user_id: currentUserId,
    type: 'inquiry',
    folder: 'inbox',
    title: 'アセトンの見積依頼',
    content: '拝啓\n\nアセトン≥99.5%の見積もりをお願いいたします。\n\n数量：2000 kg\n納期：FOB 上海\n\n最適な価格をお知らせください。',
    language: 'ja',
    translations: {},
    sender_id: null,
    sender_name: '田中太郎',
    sender_address: 'tanaka@japan-chem.co.jp',
    recipient_id: currentUserId,
    recipient_name: 'Normal User',
    recipient_address: 'user@company.com',
    product_name: 'アセトン',
    cas: '67-64-1',
    quantity: '2000 kg',
    status: 'sent',
    unread: false,
    starred: false,
    deleted: false,
    archived: false,
    attachments: [],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  // 韩文消息
  {
    id: 'inbox-ko-1',
    user_id: currentUserId,
    type: 'inquiry',
    folder: 'inbox',
    title: '아세톤 견적 요청',
    content: '존경하는 공급업체,\n\n아세톤≥99.5%의 견적을 요청합니다.\n\n수량: 2500 kg\n납품: FOB 상하이\n\n최고의 가격을 제공해 주십시오.',
    language: 'ko',
    translations: {},
    sender_id: null,
    sender_name: '김철수',
    sender_address: 'kim.cheolsu@korea-chem.co.kr',
    recipient_id: currentUserId,
    recipient_name: 'Normal User',
    recipient_address: 'user@company.com',
    product_name: '아세톤',
    cas: '67-64-1',
    quantity: '2500 kg',
    status: 'sent',
    unread: false,
    starred: false,
    deleted: false,
    archived: false,
    attachments: [],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  // 德文消息
  {
    id: 'inbox-de-1',
    user_id: currentUserId,
    type: 'inquiry',
    folder: 'inbox',
    title: 'Aceton Preisangebot',
    content: 'Sehr geehrte Damen und Herren,\n\nWir möchten ein Preisangebot für Aceton ≥99.5% anfordern.\n\nMenge: 1800 kg\nLieferung: FOB Shanghai\n\nBitte geben Sie Ihr bestes Angebot ab.',
    language: 'de',
    translations: {},
    sender_id: null,
    sender_name: 'Hans Müller',
    sender_address: 'hans.mueller@german-chem.de',
    recipient_id: currentUserId,
    recipient_name: 'Normal User',
    recipient_address: 'user@company.com',
    product_name: 'Aceton',
    cas: '67-64-1',
    quantity: '1800 kg',
    status: 'sent',
    unread: false,
    starred: false,
    deleted: false,
    archived: false,
    attachments: [],
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    sent_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    read_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  }
];

async function main() {
  try {
    console.log('📨 Creating Inbox messages with multiple languages...');

    const db = await getDb();

    let createdCount = 0;

    for (const message of inboxMessages) {
      // 检查消息是否已存在
      const existingQuery = sql`
        SELECT id FROM messages WHERE id = ${message.id}
      `;
      const existing = await db.execute(existingQuery);

      if (existing.rows.length > 0) {
        console.log(`⏭️  Skipping existing message: ${message.id} (${message.language})`);
        continue;
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
          ${message.id}, ${message.user_id}, ${message.type}, ${message.folder},
          ${message.title}, ${message.content},
          ${message.language}, ${JSON.stringify(message.translations)},
          ${message.sender_id}, ${message.sender_name}, ${message.sender_address},
          ${message.recipient_id}, ${message.recipient_name}, ${message.recipient_address},
          ${message.product_name}, ${message.cas}, ${message.quantity},
          ${message.status}, ${message.unread}, ${message.starred}, ${message.deleted}, ${message.archived},
          ${JSON.stringify(message.attachments)}, ${message.created_at}, ${message.sent_at}, ${message.read_at}
        )
      `;

      await db.execute(insertQuery);
      console.log(`✓ Created message: ${message.id} (${message.language}) - ${message.title}`);
      createdCount++;
    }

    console.log(`\n✅ Successfully created ${createdCount} Inbox messages`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total messages: ${inboxMessages.length}`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Skipped: ${inboxMessages.length - createdCount}`);
    console.log(`\n   Languages: ${[...new Set(inboxMessages.map(m => m.language))].join(', ')}`);

  } catch (error: any) {
    console.error('❌ Error creating Inbox messages:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
