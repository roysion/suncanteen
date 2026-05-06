const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

const create = async (req, res) => {
  try {
    const { name, code, type, parent_id, address, contact_name, contact_phone, stages } = req.body;
    
    const existing = await query('SELECT id FROM organizations WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json(errorResponse('机构编码已存在', 400));
    }

    const result = await query(
      'INSERT INTO organizations (name, code, type, parent_id, address, contact_name, contact_phone, stages) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, code, type, parent_id || null, address, contact_name, contact_phone, JSON.stringify(stages || [])]
    );

    res.json(successResponse({ id: result.insertId }, '机构创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const list = async (req, res) => {
  try {
    const { parent_id, type } = req.query;
    
    let sql = 'SELECT * FROM organizations WHERE status = "active"';
    const params = [];

    if (parent_id) {
      sql += ' AND parent_id = ?';
      params.push(parent_id);
    }

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY type, name';

    const orgs = await query(sql, params);
    res.json(successResponse(orgs, '获取机构列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const orgs = await query('SELECT * FROM organizations WHERE id = ?', [id]);
    if (orgs.length === 0) {
      return res.status(404).json(errorResponse('机构不存在', 404));
    }

    res.json(successResponse(orgs[0], '获取机构信息成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, contact_name, contact_phone, stages } = req.body;

    const orgs = await query('SELECT id FROM organizations WHERE id = ?', [id]);
    if (orgs.length === 0) {
      return res.status(404).json(errorResponse('机构不存在', 404));
    }

    const updateFields = [];
    const params = [];

    if (name) { updateFields.push('name = ?'); params.push(name); }
    if (address) { updateFields.push('address = ?'); params.push(address); }
    if (contact_name) { updateFields.push('contact_name = ?'); params.push(contact_name); }
    if (contact_phone) { updateFields.push('contact_phone = ?'); params.push(contact_phone); }
    if (stages) { updateFields.push('stages = ?'); params.push(JSON.stringify(stages)); }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse('请提供要更新的字段', 400));
    }

    params.push(id);
    await query(`UPDATE organizations SET ${updateFields.join(', ')} WHERE id = ?`, params);
    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE organizations SET status = "inactive" WHERE id = ?', [id]);
    res.json(successResponse(null, '禁用成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { create, list, getById, update, remove };