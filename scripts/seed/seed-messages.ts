import { messageRepository } from '@/repositories/messageRepository';

const CURRENT_USER_ID = 'c4ca4238-a0b9-2382-0dcc-509a6f75849b';

const TEST_INQUIRIES = [
  {
    subject: 'Inquiry for Acetone (CAS: 67-64-1)',
    content: 'Dear Supplier,\n\nWe are interested in purchasing Acetone (CAS: 67-64-1) with purity ≥99.5%.\n\nQuantity: 1000 kg\nDelivery: 30 days\n\nPlease provide your best offer.\n\nBest regards',
    productName: 'Acetone',
    cas: '67-64-1',
    quantity: '1000 kg',
  },
  {
    subject: 'RFQ for Methanol (CAS: 67-56-1)',
    content: 'Hello,\n\nWe would like to request a quotation for Methanol (CAS: 67-56-1).\n\nSpecifications:\n- Purity: ≥99.9%\n- Packaging: 200L drums\n- Quantity: 2000 L\n\nThank you for your time.',
    productName: 'Methanol',
    cas: '67-56-1',
    quantity: '2000 L',
  },
  {
    subject: 'Bulk Order: Ethanol (CAS: 64-17-5)',
    content: 'Dear Team,\n\nWe are looking for a long-term supplier for Ethanol.\n\nRequirements:\n- Purity: ≥99.8%\n- Quantity: 5000 L/month\n- Contract duration: 12 months\n\nPlease send your quotation.\n\nRegards',
    productName: 'Ethanol',
    cas: '64-17-5',
    quantity: '5000 L/month',
  },
  {
    subject: 'Price Inquiry: Isopropanol',
    content: 'Hi,\n\nCould you please provide current pricing for Isopropanol (CAS: 67-63-0)?\n\nWe need:\n- 500 L (immediate)\n- Optional: additional 2000 L in Q2\n\nBest,\nChemicaloop Team',
    productName: 'Isopropanol',
    cas: '67-63-0',
    quantity: '500 L',
  },
  {
    subject: 'Toluene Supply - Urgent',
    content: 'Dear Supplier,\n\nUrgent inquiry for Toluene (CAS: 108-88-3).\n\nWe need 800 kg delivered within 7 days.\n\nPlease confirm availability and pricing.\n\nThanks!',
    productName: 'Toluene',
    cas: '108-88-3',
    quantity: '800 kg',
  },
];

const TEST_REPLIES = [
  {
    subject: '中文回复：丙酮报价',
    content: '尊敬的客户，\n\n感谢您的询价。\n\n我们可以为您提供：\n- 丙酮 ≥99.5%\n- 价格：$2.50/kg\n- 交货：15天\n\n期待您的订单。\n\n此致\n敬礼',
    senderName: '中国供应商',
    language: 'zh',
  },
  {
    subject: 'English Reply: Methanol Quote',
    content: 'Hello,\n\nThank you for your RFQ.\n\nOur quotation:\n- Methanol ≥99.9%\n- Price: $1.80/L\n- Packaging: 200L drums\n\nPlease let us know if you need more information.',
    senderName: 'UK Supplier',
    language: 'en',
  },
  {
    subject: '日本語返信：エタノール見積もり',
    content: 'お客様へ\n\nお問い合わせありがとうございます。\n\nエタノールの見積もり：\n- 純度 ≥99.8%\n- 価格：$3.00/L\n- 納期：20日\n\nご注文をお待ちしております。\n\nよろしくお願いいたします',
    senderName: '日本のサプライヤー',
    language: 'ja',
  },
  {
    subject: '한국어 답변: 아세트산 견적',
    content: '존경하는 고객님,\n\n문의해 주셔서 감사합니다.\n\n저희의 제안:\n- 아세트산 ≥99.5%\n- 가격: $2.30/kg\n- 납기: 12일\n\n주문을 기다리겠습니다.\n\n감사합니다',
    senderName: '한국 공급업체',
    language: 'ko',
  },
  {
    subject: 'Deutsche Antwort: Formaldehyd Angebot',
    content: 'Sehr geehrter Kunde,\n\nVielen Dank für Ihre Anfrage.\n\nUnser Angebot:\n- Formaldehyd 37% Lösung\n- Preis: €2.80/L\n- Lieferzeit: 14 Tage\n\nWir freuen uns auf Ihre Bestellung.\n\nMit freundlichen Grüßen',
    senderName: 'Deutscher Lieferant',
    language: 'de',
  },
  {
    subject: 'Réponse Française: Acide Acétique',
    content: "Cher client,\n\nMerci pour votre demande.\n\nNotre proposition:\n- Acide acétique ≥99.5%\n- Prix: €2.70/kg\n- Délai de livraison: 16 jours\n\nDans l'attente de votre commande.\n\nCordialement",
    senderName: 'Fournisseur Français',
    language: 'fr',
  },
  {
    subject: 'Respuesta Española: Etanol Cotización',
    content: 'Estimado cliente,\n\nGracias por su consulta.\n\nNuestra oferta:\n- Etanol ≥99.8%\n- Precio: $3.20/L\n- Tiempo de entrega: 18 días\n\nEsperamos su pedido.\n\nSaludos cordiales',
    senderName: 'Proveedor Español',
    language: 'es',
  },
  {
    subject: 'Resposta Portuguesa: Metanol Cotação',
    content: 'Prezado cliente,\n\nObrigado pela sua consulta.\n\nNossa proposta:\n- Metanol ≥99.9%\n- Preço: R$9.50/L\n- Prazo de entrega: 15 dias\n\nAguardamos seu pedido.\n\nAtenciosamente',
    senderName: 'Fornecedor Português',
    language: 'pt',
  },
  {
    subject: 'Русский ответ: Ацетон предложение',
    content: 'Уважаемый клиент,\n\nСпасибо за ваш запрос.\n\nНаше предложение:\n- Ацетон ≥99.5%\n- Цена: $2.40/kg\n- Срок поставки: 17 дней\n\nЖдем вашего заказа.\n\nС уважением',
    senderName: 'Русский поставщик',
    language: 'ru',
  },
  {
    subject: 'رد عربي: الميثانول عرض',
    content: 'عزيزي العميل،\n\nشكرًا لاستفسارك.\n\nعرضنا:\n- الميثانول ≥99.9%\n- السعر: $3.50/L\n- وقت التسليم: 20 يومًا\n\nنتطلع إلى طلبك.\n\nشكرًا جزيلًا',
    senderName: 'مورد عربي',
    language: 'ar',
  },
];

async function seedMessages() {
  console.log('=== Seeding Test Messages ===\n');

  try {
    // 1. 添加询价消息（用户发送的）- 这些会显示在 Inquiries 和 Sent 文件夹
    console.log('1. Creating inquiry messages (Inquiries + Sent)...');
    for (let i = 0; i < TEST_INQUIRIES.length; i++) {
      const inquiry = TEST_INQUIRIES[i];
      
      const message = await messageRepository.createMessage({
        userId: CURRENT_USER_ID,
        type: 'inquiry',
        folder: 'sent',
        title: inquiry.subject,
        content: inquiry.content,
        senderId: CURRENT_USER_ID,
        senderName: 'Normal User',
        senderAddress: CURRENT_USER_ID,
        recipientId: `agent-${String(i + 1).padStart(3, '0')}`,
        recipientName: `Chemical Supplier ${i + 1}`,
        recipientAddress: `agent-${String(i + 1).padStart(3, '0')}`,
        productName: inquiry.productName,
        cas: inquiry.cas,
        quantity: inquiry.quantity,
        status: 'sent',
        unread: false,
        starred: i < 2, // 标记前2个为星标
        deleted: false,
        archived: false,
        createdAt: new Date(Date.now() - i * 86400000), // 每天一条
        sentAt: new Date(Date.now() - i * 86400000),
      });

      console.log(`  ✓ Created: ${inquiry.subject.substring(0, 50)}...`);
    }

    // 2. 添加回复消息（用户收到的）- 这些会显示在 Inbox 文件夹
    console.log('\n2. Creating reply messages (Inbox)...');
    for (let i = 0; i < TEST_REPLIES.length; i++) {
      const reply = TEST_REPLIES[i];

      const message = await messageRepository.createMessage({
        userId: CURRENT_USER_ID,
        type: 'reply',
        folder: 'inbox',
        title: reply.subject,
        content: reply.content,
        language: reply.language,
        senderId: `agent-${String(i + 1).padStart(3, '0')}`,
        senderName: reply.senderName,
        senderAddress: `agent-${String(i + 1).padStart(3, '0')}`,
        recipientId: CURRENT_USER_ID,
        recipientName: 'Normal User',
        recipientAddress: CURRENT_USER_ID,
        status: 'sent',
        unread: true, // 所有回复都设为未读
        starred: false,
        deleted: false,
        archived: false,
        createdAt: new Date(Date.now() - (i + 1) * 3600000), // 每小时一条
        sentAt: new Date(Date.now() - (i + 1) * 3600000),
      });

      console.log(`  ✓ Created: ${reply.subject.substring(0, 50)}... (${reply.language})`);
    }

    // 3. 添加草稿消息
    console.log('\n3. Creating draft messages...');
    const drafts = [
      {
        title: 'Draft: Acetic Acid Inquiry',
        content: 'Dear Supplier,\n\nWe would like to inquire about Acetic Acid...',
        productName: 'Acetic Acid',
        cas: '64-19-7',
      },
      {
        title: 'Draft: Formaldehyde Quote',
        content: 'Hello,\n\nPlease provide quotation for Formaldehyde...',
        productName: 'Formaldehyde',
        cas: '50-00-0',
      },
    ];

    for (const draft of drafts) {
      const message = await messageRepository.createMessage({
        userId: CURRENT_USER_ID,
        type: 'inquiry',
        folder: 'drafts',
        title: draft.title,
        content: draft.content,
        senderId: CURRENT_USER_ID,
        senderName: 'Normal User',
        senderAddress: CURRENT_USER_ID,
        recipientId: 'agent-001',
        recipientName: 'Chemical Supplier 1',
        recipientAddress: 'agent-001',
        productName: draft.productName,
        cas: draft.cas,
        quantity: 'TBD',
        status: 'pending', // pending 表示草稿
        unread: false,
        starred: false,
        deleted: false,
        archived: false,
        createdAt: new Date(),
        sentAt: new Date(),
      });

      console.log(`  ✓ Created: ${draft.title.substring(0, 50)}...`);
    }

    console.log('\n✅ Test messages seeded successfully!');
    console.log('\nSummary:');
    console.log(`  - ${TEST_INQUIRIES.length} inquiry messages (Inquiries + Sent folder)`);
    console.log(`  - ${TEST_REPLIES.length} reply messages (Inbox folder, ${TEST_REPLIES.length} unread, 10 languages)`);
    console.log(`  - ${drafts.length} draft messages (Drafts folder)`);
    console.log(`\nLanguages: ${TEST_REPLIES.map(r => r.language).join(', ')}`);
    console.log(`\nTotal messages: ${TEST_INQUIRIES.length + TEST_REPLIES.length + drafts.length}`);

  } catch (error) {
    console.error('❌ Error seeding messages:', error);
    throw error;
  }
}

// 导出函数供外部调用
export { seedMessages };

// 如果直接运行此文件，执行种子数据生成
if (require.main === module) {
  seedMessages().catch(console.error);
}
