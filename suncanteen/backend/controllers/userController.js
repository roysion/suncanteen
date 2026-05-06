const { query } = require('../config/database');
const { successResponse, errorResponse, hashPassword } = require('../utils/helpers');

const create = async (req, res) => {
  try {
    const { username, password, real_name, phone, email, organization_id, role_id } = req.body;
    
    const existing = await query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json(errorResponse('用户名已存在', 400));
    }

    const hashedPassword = await hashPassword(password);
    
    const result = await query(
      'INSERT INTO users (username, password, real_name, phone, email, organization_id, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, real_name, phone, email, organization_id, role_id]
    );

    res.json(successResponse({ id: result.insertId }, '用户创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const list = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, size = 10, keyword, organization_id } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT u.*, r.name as role_name, o.name as organization_name FROM users u LEFT JOIN roles r ON u.role_id = r.id LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.status = "active"';
    const params = [];

    const org = await query('SELECT type, parent_id FROM organizations WHERE id = ?', [user.organization_id]);
    if (org[0]?.type === 'school') {
      sql += ' AND u.organization_id = ?';
      params.push(user.organization_id);
    } else if (org[0]?.type === 'township_center') {
      const schools = await query('SELECT id FROM organizations WHERE parent_id = ?', [user.organization_id]);
      const schoolIds = [user.organization_id, ...schools.map(s => s.id)].join(',');
      sql += ` AND u.organization_id IN (${schoolIds})`;
    }

    if (organization_id) {
      sql += ' AND u.organization_id = ?';
      params.push(organization_id);
    }

    if (keyword) {
      sql += ' AND (u.username LIKE ? OR u.real_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const users = await query(sql, params);
    const countSql = sql.replace(/ORDER BY.*$/, '');
    const countParams = params.slice(0, -2);
    const count = await query(countSql.replace('SELECT u.*, r.name as role_name, o.name as organization_name', 'SELECT COUNT(*) as total'), countParams);

    res.json(successResponse({ users, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取用户列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const users = await query('SELECT u.*, r.name as role_name, o.name as organization_name FROM users u LEFT JOIN roles r ON u.role_id = r.id LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json(errorResponse('用户不存在', 404));
    }

    const user = users[0];
    delete user.password;
    
    res.json(successResponse(user, '获取用户信息成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { real_name, phone, email, role_id, organization_id } = req.body;

    const users = await query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json(errorResponse('用户不存在', 404));
    }

    const updateFields = [];
    const params = [];

    if (real_name) { updateFields.push('real_name = ?'); params.push(real_name); }
    if (phone) { updateFields.push('phone = ?'); params.push(phone); }
    if (email) { updateFields.push('email = ?'); params.push(email); }
    if (role_id) { updateFields.push('role_id = ?'); params.push(role_id); }
    if (organization_id) { updateFields.push('organization_id = ?'); params.push(organization_id); }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse('请提供要更新的字段', 400));
    }

    params.push(id);
    await query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, params);
    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    const hashedPassword = await hashPassword(password);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    res.json(successResponse(null, '密码更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE users SET status = "inactive" WHERE id = ?', [id]);
    res.json(successResponse(null, '禁用成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const listRoles = async (req, res) => {
  try {
    const roles = await query('SELECT id, name, description FROM roles');
    res.json(successResponse(roles, '获取角色列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { create, list, getById, update, updatePassword, remove, listRoles };