import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

// 模拟外网邮件数据
const externalEmails = [
  {
    id: 'ext-email-1',
    title: 'Re: Chemical Product Inquiry - Sulfuric Acid',
    content: 'Dear Customer,\n\nThank you for your inquiry regarding sulfuric acid. We are pleased to provide our quotation:\n\nProduct: Sulfuric Acid (H2SO4)\n- Purity: ≥98%\n- Package: 50kg HDPE drum\n- Price: USD 1.50/kg\n- MOQ: 1000kg\n\nPayment: 30% deposit by T/T\nDelivery: FOB Shanghai, 10-15 working days\n\nPlease let us know if you have any questions.\n\nBest regards,\nChemSales Team',
    sender_name: 'ChemSales Support',
    sender_address: 'support@chemsales.abc.com',
    recipient_name: 'Normal User',
    recipient_address: 'normal@chemicaloop',
    language: 'en',
  },
  {
    id: 'ext-email-2',
    title: 'Price Update Notification - Methanol',
    content: 'Dear Customer,\n\nThis is to inform you that due to recent market fluctuations, the price of methanol has been updated.\n\nNew Price: USD 1.90/liter (effective from Feb 15, 2026)\nPrevious Price: USD 1.80/liter\n\nWe recommend placing your orders before the price adjustment takes effect.\n\nIf you have any questions, please feel free to contact our sales team.\n\nSincerely,\nPricing Department\nGlobalChem Trading',
    sender_name: 'GlobalChem Pricing',
    sender_address: 'pricing@globalchem.abc.com',
    recipient_name: 'Normal User',
    recipient_address: 'normal@chemicaloop',
    language: 'en',
  },
  {
    id: 'ext-email-3',
    title: 'Order Confirmation - Order #20260213001',
    content: 'Dear Customer,\n\nWe are pleased to confirm your order:\n\nOrder Number: #20260213001\nOrder Date: February 13, 2026\n\nItems:\n- Hydrochloric Acid (36%) - 500kg\n- Sodium Hydroxide (99%) - 300kg\n\nTotal Amount: USD 1,250.00\n\nEstimated Delivery: February 28, 2026\nPayment Terms: 30% deposit, 70% before delivery\n\nYour order is being processed and you will receive a shipping notification once the goods are dispatched.\n\nThank you for your business!\n\nBest regards,\nOrder Management Team',
    sender_name: 'Order Management',
    sender_address: 'orders@globalchem.abc.com',
    recipient_name: 'Normal User',
    recipient_address: 'normal@chemicaloop',
    language: 'en',
  },
  {
    id: 'ext-email-4',
    title: 'Shipping Notification - Order #20260205001',
    content: 'Dear Customer,\n\nYour order has been shipped:\n\nOrder Number: #20260205001\nShipment Date: February 12, 2026\nCarrier: DHL Express\nTracking Number: 1234567890123\nEstimated Delivery: February 17, 2026\n\nShipment Details:\n- Acetone (99.5%) - 200kg\n- Benzene (99.7%) - 150kg\n\nYou can track your shipment using the tracking number provided.\n\nIf you have any questions or concerns, please contact our customer service.\n\nBest regards,\nLogistics Department',
    sender_name: 'Logistics Department',
    sender_address: 'logistics@globalchem.abc.com',
    recipient_name: 'Normal User',
    recipient_address: 'normal@chemicaloop',
    language: 'en',
  },
  {
    id: 'ext-email-5',
    title: 'Product Availability Alert - Acetone',
    content: 'Dear Customer,\n\nWe would like to inform you that acetone is currently in limited supply due to increased global demand.\n\nCurrent Stock Status: Limited\nEstimated Restock Date: March 5, 2026\n\nWe recommend placing your orders in advance to secure your supply.\n\nFor urgent orders, please contact our sales team directly at sales@globalchem.abc.com\n\nThank you for your understanding.\n\nBest regards,\nInventory Management Team',
    sender_name: 'Inventory Team',
    sender_address: 'inventory@globalchem.abc.com',
    recipient_name: 'Normal User',
    recipient_address: 'normal@chemicaloop',
    language: 'en',
  },
  {
    id: 'ext-email-6',
    title: 'Monthly Newsletter - Chemical Industry Update',
    content: 'Dear Customer,\n\nWelcome to our monthly chemical industry update.\n\nThis Month Highlights:\n\n1. Market Trends\n   - Global chemical prices showing stability\n   - Increased demand for specialty chemicals\n\n2. New Products\n   - Introducing our new line of eco-friendly solvents\n   - Green chemistry solutions for sustainable manufacturing\n\n3. Industry News\n   - New environmental regulations coming into effect\n   - Changes in chemical transportation guidelines\n\n4. Special Offers\n   - 10% discount on all eco-friendly products this month\n   - Free shipping for orders over USD 5,000\n\nFor more information, please visit our website or contact our sales team.\n\nBest regards,\nMarketing Department\nGlobalChem Trading',
    sender_name: 'Marketing Newsletter',
    sender_address: 'newsletter@globalchem.abc.com',
    recipient_name: 'Normal User',
    recipient_address: 'normal@chemicaloop',
    language: 'en',
  },
  {
    id: 'ext-email-7',
    title: 'Invoice - Invoice #INV-20260213001',
    content: 'Dear Customer,\n\nPlease find attached the invoice for your recent order.\n\nInvoice Number: INV-20260213001\nInvoice Date: February 13, 2026\nDue Date: February 28, 2026\n\nTotal Amount: USD 1,250.00\n\nPayment Details:\n- Bank Name: GlobalBank\n- Account Number: 1234567890\n- SWIFT Code: GLBLUS33\n\nPlease arrange payment by the due date to avoid any late fees.\n\nIf you have any questions regarding this invoice, please contact our accounts department.\n\nBest regards,\nAccounts Receivable Team',
    sender_name: 'Accounts Receivable',
    sender_address: 'billing@globalchem.abc.com',
    recipient_name: 'Normal User',
    recipient_address: 'normal@chemicaloop',
    language: 'en',
  },
  {
    id: 'ext-email-8',
    title: 'Payment Confirmation - Order #20260205001',
    content: 'Dear Customer,\n\nWe have received your payment for the following order:\n\nOrder Number: #20260205001\nPayment Date: February 13, 2026\nPayment Method: Wire Transfer\nAmount: USD 980.00\nReference Number: TXN-20260213-001\n\nYour order is now being processed and will be shipped according to the agreed schedule.\n\nThank you for your prompt payment.\n\nBest regards,\nFinance Department',
    sender_name: 'Finance Department',
    sender_address: 'finance@globalchem.abc.com',
    recipient_name: 'Normal User',
    recipient_address: 'normal@chemicaloop',
    language: 'en',
  },
];

async function createExternalEmails() {
  console.log('=== Creating External Emails ===');

  for (const email of externalEmails) {
    try {
      // 检查邮件是否已存在
      const existingEmail = await pool.query(
        'SELECT id FROM messages WHERE id = $1',
        [email.id]
      );

      if (existingEmail.rows.length > 0) {
        console.log(`✓ Email already exists: ${email.title}`);
        continue;
      }

      // 创建外网邮件
      const result = await pool.query(
        `INSERT INTO messages (
          id, user_id, type, folder, title, content,
          sender_name, sender_address,
          recipient_name, recipient_address,
          status, unread, starred, deleted, archived,
          language
        ) VALUES (
          $1, $2, 'inquiry', 'inbox', $3, $4,
          $5, $6,
          $7, $8,
          'received', true, false, false, false,
          $9
        ) RETURNING id, title, sender_name, sender_address`,
        [
          email.id,
          'c4ca4238-a0b9-2382-0dcc-509a6f75849b', // Normal User ID
          email.title,
          email.content,
          email.sender_name,
          email.sender_address,
          email.recipient_name,
          email.recipient_address,
          email.language,
        ]
      );

      console.log(`✓ Created email: ${result.rows[0].title}`);
      console.log(`  From: ${result.rows[0].sender_name} (${result.rows[0].sender_address})`);
    } catch (error) {
      console.error(`✗ Failed to create email ${email.id}:`, error);
    }
  }

  console.log('\n=== Summary ===');
  console.log('✓ External emails created');
  console.log('✓ All emails are from external domains (abc.com)');
  console.log('✓ These are NOT internal users, so no exchange contact button');
}

createExternalEmails().catch(console.error);
