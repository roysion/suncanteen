const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

const getSettings = async (req, res) => {
  try {
    const settings = await query('SELECT setting_key, setting_value, description FROM system_settings');
    const result = {};
    settings.forEach(s => {
      result[s.setting_key] = { value: s.setting_value, description: s.description };
    });
    res.json(successResponse(result, '获取系统设置成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const updateSettings = async (req, res) => {
  try {
    const settings = req.body;
    
    for (const key of Object.keys(settings)) {
      await query('UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [settings[key], key]);
    }

    res.json(successResponse(null, '系统设置更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getLogs = async (req, res) => {
  try {
    const { page = 1, size = 20, user_id, start_date, end_date, keyword, type } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT * FROM operation_logs WHERE 1=1';
    const params = [];

    if (user_id) {
      sql += ' AND user_id = ?';
      params.push(user_id);
    }

    if (type) {
      sql += ' AND operation_type = ?';
      params.push(type);
    }

    if (keyword) {
      sql += ' AND (operation_module LIKE ? OR operation_detail LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (start_date) {
      sql += ' AND created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const logs = await query(sql, params);
    const countSql = sql.replace(/ORDER BY.*$/, '');
    const countParams = params.slice(0, -2);
    const count = await query(countSql.replace('SELECT *', 'SELECT COUNT(*) as total'), countParams);

    res.json(successResponse({ logs, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取操作日志成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { getSettings, updateSettings, getLogs };