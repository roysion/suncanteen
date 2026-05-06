const { verifyToken, errorResponse } = require('../utils/helpers');
const { query } = require('../config/database');

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json(errorResponse('未提供认证令牌', 401));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json(errorResponse('无效的认证令牌', 401));
  }

  try {
    const user = await query('SELECT * FROM users WHERE id = ? AND status = "active"', [decoded.userId]);
    if (!user || user.length === 0) {
      return res.status(401).json(errorResponse('用户不存在或已禁用', 401));
    }

    req.user = user[0];
    next();
  } catch (error) {
    return res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const role = await query('SELECT permissions FROM roles WHERE id = ?', [req.user.role_id]);
      if (!role || role.length === 0) {
        return res.status(403).json(errorResponse('角色不存在', 403));
      }

      const permissions = JSON.parse(role[0].permissions);
      if (!permissions[permission]) {
        return res.status(403).json(errorResponse('没有权限执行此操作', 403));
      }

      next();
    } catch (error) {
      return res.status(500).json(errorResponse('服务器内部错误', 500));
    }
  };
};

const requireRole = (roleNames) => {
  return async (req, res, next) => {
    try {
      const role = await query('SELECT name FROM roles WHERE id = ?', [req.user.role_id]);
      if (!role || role.length === 0) {
        return res.status(403).json(errorResponse('角色不存在', 403));
      }

      if (!roleNames.includes(role[0].name)) {
        return res.status(403).json(errorResponse('角色不允许执行此操作', 403));
      }

      next();
    } catch (error) {
      return res.status(500).json(errorResponse('服务器内部错误', 500));
    }
  };
};

module.exports = { auth, requirePermission, requireRole };