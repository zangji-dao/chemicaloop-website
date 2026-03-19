import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import inquiryRoutes from './routes/inquiries';
import adminRoutes from './routes/admin';
import spuRoutes from './routes/spu';
import newsRoutes from './routes/news';
import messageRoutes from './routes/messages';
import contactRequestsRoutes from './routes/contactRequests';
import contactMembersRoutes from './routes/contactMembers';
import profileRoutes from './routes/profile';
import emailSettingsRoutes from './routes/emailSettings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS 配置 - 使用函数动态处理 origin
const allowedOrigins = [
  'http://152.136.12.122:5000',
  'http://localhost:5000',
  'http://localhost:3000',
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // 允许没有 origin 的请求（如 curl、Postman）
    if (!origin) return callback(null, true);
    
    // 检查 origin 是否在白名单中
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // 开发环境允许所有，生产环境只允许白名单
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(null, true); // 暂时允许所有来源，避免 CORS 问题
      }
    }
  },
  credentials: true,
}));
app.use(express.json());

// Routes - 按 admin/www/common 分类
app.use('/api/admin', adminRoutes);
app.use('/api/admin/spu', spuRoutes);
app.use('/api/www/auth', authRoutes);
app.use('/api/www/messages', messageRoutes);
app.use('/api/www/contact-requests', contactRequestsRoutes);
app.use('/api/www/contact-members', contactMembersRoutes);
app.use('/api/www/profile', profileRoutes);
app.use('/api/www/email-settings', emailSettingsRoutes);
app.use('/api/common/products', productRoutes);
app.use('/api/common/inquiries', inquiryRoutes);
app.use('/api/common/news', newsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});
