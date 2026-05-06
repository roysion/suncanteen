const { query } = require('../config/database');
const { generateToken, comparePassword, successResponse, errorResponse } = require('../utils/helpers');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json(errorResponse('用户名和密码不能为空', 400));
    }

    const users = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (!users || users.length === 0) {
      return res.status(401).json(errorResponse('用户名或密码错误', 401));
    }

    const user = users[0];
    if (user.status !== 'active') {
      return res.status(401).json(errorResponse('用户已被禁用', 401));
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('用户名或密码错误', 401));
    }

    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    const role = await query('SELECT name, permissions FROM roles WHERE id = ?', [user.role_id]);
    const org = await query('SELECT name, type FROM organizations WHERE id = ?', [user.organization_id]);

    const token = generateToken(user.id, user.username, user.role_id);
    
    const userInfo = {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      phone: user.phone,
      email: user.email,
      organization_id: user.organization_id,
      organization_name: org[0]?.name || '',
      organization_type: org[0]?.type || '',
      role_id: user.role_id,
      role_name: role[0]?.name || '',
      permissions: role[0] ? JSON.parse(role[0].permissions) : {}
    };

    res.json(successResponse({ token, user: userInfo }, '登录成功'));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const logout = async (req, res) => {
  try {
    res.json(successResponse(null, '退出成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getUserInfo = async (req, res) => {
  try {
    const { user } = req;
    const role = await query('SELECT name, permissions FROM roles WHERE id = ?', [user.role_id]);
    const org = await query('SELECT name, type FROM organizations WHERE id = ?', [user.organization_id]);

    const userInfo = {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      phone: user.phone,
      email: user.email,
      organization_id: user.organization_id,
      organization_name: org[0]?.name || '',
      organization_type: org[0]?.type || '',
      role_id: user.role_id,
      role_name: role[0]?.name || '',
      permissions: role[0] ? JSON.parse(role[0].permissions) : {}
    };

    res.json(successResponse(userInfo, '获取用户信息成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { login, logout, getUserInfo };