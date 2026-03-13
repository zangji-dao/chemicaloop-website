import { assertDevEnvironment } from '../lib/env-check';
assertDevEnvironment();

/**
 * 模拟即时通讯数据脚本
 * 创建收到申请、已发申请，以及相关的邮件往来
 */

import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';

async function seedCircleData() {
  console.log('开始模拟即时通讯数据...');
  
  const db = await getDb(schema);
  
  // 当前用户ID（测试用户 normaluser）
  // 注意：必须与 create-test-users.js 中的 ID 一致
  const currentUserId = 'c4ca4238a0b923820dcc509a6f75849b';
  
  // 创建测试用户（如果不存在）
  const testUsers = [
    {
      id: '10000001-0000-0000-0000-000000000001',
      email: 'zhang.wei@chemicalloop',
      name: '张伟',
      username: 'zhangwei',
      internalEmail: 'zhang.wei@chemicalloop',
    },
    {
      id: '10000001-0000-0000-0000-000000000002', 
      email: 'sato.yuki@chemicalloop',
      name: '佐藤雪',
      username: 'satoyuki',
      internalEmail: 'sato.yuki@chemicalloop',
    },
    {
      id: '10000001-0000-0000-0000-000000000003',
      email: 'kim.minho@chemicalloop',
      name: '金敏浩',
      username: 'kimminho',
      internalEmail: 'kim.minho@chemicalloop',
    },
    {
      id: '10000001-0000-0000-0000-000000000004',
      email: 'hans.mueller@chemicalloop',
      name: 'Hans Müller',
      username: 'hansmueller',
      internalEmail: 'hans.mueller@chemicalloop',
    },
    {
      id: '10000001-0000-0000-0000-000000000005',
      email: 'marie.dubois@chemicalloop',
      name: 'Marie Dubois',
      username: 'mariedubois',
      internalEmail: 'marie.dubois@chemicalloop',
    },
  ];
  
  // 插入测试用户
  console.log('创建测试用户...');
  for (const user of testUsers) {
    try {
      await db.execute(sql`
        INSERT INTO users (id, email, password_hash, name, username, internal_email, role, verified)
        VALUES (${user.id}, ${user.email}, 'hashed_password', ${user.name}, ${user.username}, ${user.internalEmail}, 'USER', true)
        ON CONFLICT (id) DO NOTHING
      `);
    } catch (error) {
      console.log(`用户 ${user.name} 已存在，跳过`);
    }
  }
  
  // 创建邮件往来
  console.log('创建邮件往来...');
  
  const messages = [
    // 张伟发给我的邮件
    {
      id: '20000001-0000-0000-0000-000000000001',
      userId: currentUserId,
      senderId: testUsers[0].id,
      senderName: testUsers[0].name,
      senderAddress: testUsers[0].internalEmail,
      recipientId: currentUserId,
      recipientName: 'Test User',
      recipientAddress: 'test@chemicalloop',
      title: '关于乙酸乙酯的询价',
      content: '您好，我对贵公司的乙酸乙酯产品很感兴趣，想了解一下最新的价格和供货情况。我们公司每月需要采购约50吨。期待您的回复。',
      folder: 'inbox',
      unread: true,
      createdAt: '2025-01-15 09:30:00',
    },
    // 我回复张伟
    {
      id: '20000001-0000-0000-0000-000000000002',
      userId: currentUserId,
      senderId: currentUserId,
      senderName: 'Test User',
      senderAddress: 'test@chemicalloop',
      recipientId: testUsers[0].id,
      recipientName: testUsers[0].name,
      recipientAddress: testUsers[0].internalEmail,
      title: 'Re: 关于乙酸乙酯的询价',
      content: '张伟您好，感谢您的询价。乙酸乙酯目前报价为 ¥8,500/吨，起订量10吨。如需大量采购，我们可以提供更优惠的价格。请问您的交货地点是哪里？',
      folder: 'sent',
      unread: false,
      createdAt: '2025-01-15 14:20:00',
    },
    // 佐藤雪发给我的邮件
    {
      id: '20000001-0000-0000-0000-000000000003',
      userId: currentUserId,
      senderId: testUsers[1].id,
      senderName: testUsers[1].name,
      senderAddress: testUsers[1].internalEmail,
      recipientId: currentUserId,
      recipientName: 'Test User',
      recipientAddress: 'test@chemicalloop',
      title: '新产品合作咨询',
      content: '您好，我是日本化工株式会社的佐藤雪。我们公司正在寻找可靠的化学品供应商，贵公司的产品目录非常吸引人。请问是否可以安排一次视频会议，详细讨论合作事宜？',
      folder: 'inbox',
      unread: true,
      createdAt: '2025-01-16 10:45:00',
    },
    // 我回复佐藤雪
    {
      id: '20000001-0000-0000-0000-000000000004',
      userId: currentUserId,
      senderId: currentUserId,
      senderName: 'Test User',
      senderAddress: 'test@chemicalloop',
      recipientId: testUsers[1].id,
      recipientName: testUsers[1].name,
      recipientAddress: testUsers[1].internalEmail,
      title: 'Re: 新产品合作咨询',
      content: '佐藤雪您好，很高兴收到您的来信。我们对与日本化工株式会社的合作非常感兴趣。请问您方便在下周三或周四进行视频会议吗？我们可以使用Zoom或Teams。',
      folder: 'sent',
      unread: false,
      createdAt: '2025-01-16 16:30:00',
    },
    // 金敏浩发给我的邮件
    {
      id: '20000001-0000-0000-0000-000000000005',
      userId: currentUserId,
      senderId: testUsers[2].id,
      senderName: testUsers[2].name,
      senderAddress: testUsers[2].internalEmail,
      recipientId: currentUserId,
      recipientName: 'Test User',
      recipientAddress: 'test@chemicalloop',
      title: '磷酸三丁酯采购需求',
      content: '您好，我们需要采购磷酸三丁酯（CAS: 126-73-8），数量约20吨/月。请提供产品规格和报价。另外，是否可以提供样品？',
      folder: 'inbox',
      unread: false,
      createdAt: '2025-01-17 08:15:00',
    },
    // 我发给Hans Müller的邮件
    {
      id: '20000001-0000-0000-0000-000000000006',
      userId: currentUserId,
      senderId: currentUserId,
      senderName: 'Test User',
      senderAddress: 'test@chemicalloop',
      recipientId: testUsers[3].id,
      recipientName: testUsers[3].name,
      recipientAddress: testUsers[3].internalEmail,
      title: 'Benzene derivatives availability',
      content: 'Dear Mr. Müller, I am writing to inquire about the availability of benzene derivatives, specifically chlorobenzene and nitrobenzene. We have a client in China looking for a stable supplier. Could you please provide your current pricing and lead times?',
      folder: 'sent',
      unread: false,
      createdAt: '2025-01-18 11:00:00',
    },
    // Hans Müller回复我
    {
      id: '20000001-0000-0000-0000-000000000007',
      userId: currentUserId,
      senderId: testUsers[3].id,
      senderName: testUsers[3].name,
      senderAddress: testUsers[3].internalEmail,
      recipientId: currentUserId,
      recipientName: 'Test User',
      recipientAddress: 'test@chemicalloop',
      title: 'Re: Benzene derivatives availability',
      content: 'Dear Sir/Madam, Thank you for your inquiry. We have both chlorobenzene and nitrobenzene in stock. Our prices are competitive and we can ship within 2 weeks. I will send you a detailed quotation by tomorrow. Best regards, Hans Müller',
      folder: 'inbox',
      unread: true,
      createdAt: '2025-01-18 18:45:00',
    },
    // Marie Dubois发给我的邮件
    {
      id: '20000001-0000-0000-0000-000000000008',
      userId: currentUserId,
      senderId: testUsers[4].id,
      senderName: testUsers[4].name,
      senderAddress: testUsers[4].internalEmail,
      recipientId: currentUserId,
      recipientName: 'Test User',
      recipientAddress: 'test@chemicalloop',
      title: 'Demande de collaboration',
      content: 'Bonjour, Nous sommes une entreprise française spécialisée dans la distribution de produits chimiques. Nous serions intéressés par une collaboration avec votre société. Pourriez-vous nous envoyer votre catalogue complet ? Cordialement, Marie Dubois',
      folder: 'inbox',
      unread: true,
      createdAt: '2025-01-19 09:00:00',
    },
  ];
  
  for (const msg of messages) {
    try {
      await db.execute(sql`
        INSERT INTO messages (
          id, user_id, sender_id, sender_name, sender_address,
          recipient_id, recipient_name, recipient_address,
          title, content, folder, unread, status, created_at
        )
        VALUES (
          ${msg.id}, ${msg.userId}, ${msg.senderId}, ${msg.senderName}, ${msg.senderAddress},
          ${msg.recipientId}, ${msg.recipientName}, ${msg.recipientAddress},
          ${msg.title}, ${msg.content}, ${msg.folder}, ${msg.unread}, 'received', ${msg.createdAt}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    } catch (error) {
      console.log(`邮件 ${msg.title} 已存在，跳过`);
    }
  }
  
  // 创建收到的申请（别人发给我们的申请）
  console.log('创建收到的申请...');
  const receivedRequests = [
    {
      id: '30000001-0000-0000-0000-000000000001',
      requesterId: testUsers[0].id, // 张伟
      receiverId: currentUserId,
      messageId: messages[0].id,
      message: '您好，我们之前通过邮件沟通过乙酸乙酯的采购，希望能进一步深入合作，添加您为即时通讯联系人。',
      status: 'pending',
      createdAt: '2025-01-20 10:00:00',
    },
    {
      id: '30000001-0000-0000-0000-000000000002',
      requesterId: testUsers[1].id, // 佐藤雪
      receiverId: currentUserId,
      messageId: messages[2].id,
      message: '感谢您的回复，希望能添加即时通讯方式，方便后续的会议安排和日常沟通。',
      status: 'pending',
      createdAt: '2025-01-20 14:30:00',
    },
    {
      id: '30000001-0000-0000-0000-000000000003',
      requesterId: testUsers[4].id, // Marie Dubois
      receiverId: currentUserId,
      messageId: messages[7].id,
      message: 'We would like to exchange contact information for better communication. Looking forward to collaborating with you!',
      status: 'pending',
      createdAt: '2025-01-21 09:15:00',
    },
  ];
  
  for (const req of receivedRequests) {
    try {
      await db.execute(sql`
        INSERT INTO circle_requests (
          id, requester_id, receiver_id, message_id, message, status, created_at
        )
        VALUES (
          ${req.id}, ${req.requesterId}, ${req.receiverId}, ${req.messageId}, ${req.message}, ${req.status}, ${req.createdAt}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    } catch (error) {
      console.log(`收到申请 ${req.id} 已存在，跳过`);
    }
  }
  
  // 创建已发的申请（我们发给别人的申请）
  console.log('创建已发的申请...');
  const sentRequests = [
    {
      id: '30000001-0000-0000-0000-000000000004',
      requesterId: currentUserId,
      receiverId: testUsers[2].id, // 金敏浩
      messageId: messages[4].id,
      message: '金敏浩先生，您好！我们之前沟通过磷酸三丁酯的采购。希望能添加即时通讯方式，方便及时沟通供货情况。',
      status: 'pending',
      createdAt: '2025-01-19 16:00:00',
    },
    {
      id: '30000001-0000-0000-0000-000000000005',
      requesterId: currentUserId,
      receiverId: testUsers[3].id, // Hans Müller
      messageId: messages[6].id,
      message: 'Dear Mr. Müller, thank you for the quick response. I would like to exchange contact information for easier communication regarding the benzene derivatives.',
      status: 'pending',
      createdAt: '2025-01-19 18:30:00',
    },
  ];
  
  for (const req of sentRequests) {
    try {
      await db.execute(sql`
        INSERT INTO circle_requests (
          id, requester_id, receiver_id, message_id, message, status, created_at
        )
        VALUES (
          ${req.id}, ${req.requesterId}, ${req.receiverId}, ${req.messageId}, ${req.message}, ${req.status}, ${req.createdAt}
        )
        ON CONFLICT (id) DO NOTHING
      `);
    } catch (error) {
      console.log(`已发申请 ${req.id} 已存在，跳过`);
    }
  }
  
  console.log('模拟数据创建完成！');
  console.log(`- 创建了 ${testUsers.length} 个测试用户`);
  console.log(`- 创建了 ${messages.length} 封邮件往来`);
  console.log(`- 创建了 ${receivedRequests.length} 个收到申请`);
  console.log(`- 创建了 ${sentRequests.length} 个已发申请`);
}

seedCircleData()
  .then(() => {
    console.log('脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
