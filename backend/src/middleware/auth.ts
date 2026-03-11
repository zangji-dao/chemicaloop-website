import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/db';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // 优先使用 X-User-ID header（由 Next.js API 路由验证后传递）
  const userIdFromHeader = req.headers['x-user-id'] as string;

  if (userIdFromHeader) {
    // 验证用户是否存在
    const userResult = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [userIdFromHeader]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    req.userId = userResult.rows[0].id;
    req.userRole = userResult.rows[0].role;
    next();
    return;
  }

  // 如果没有 X-User-ID header，则使用 Authorization header（直接请求后端）
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };

    // 验证用户是否存在
    const userResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

export const agentOnlyMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'AGENT' && req.userRole !== 'ADMIN' && req.userRole !== 'OPERATOR') {
    return res.status(403).json({ success: false, error: 'Agent access only' });
  }
  next();
};

/**
 * 管理员权限中间件
 * 仅允许 ADMIN 角色访问
 */
export const adminOnlyMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }
  next();
};

/**
 * 超级管理员权限中间件
 * 仅允许 ADMIN 角色访问（目前等同于 adminOnlyMiddleware，可扩展为更严格的权限控制）
 */
export const superAdminOnlyMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: '无权访问，需要超级管理员权限' });
  }
  next();
};
