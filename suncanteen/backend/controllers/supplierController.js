const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, hashPassword } = require('../utils/helpers');

const register = async (req, res) => {
  try {
    const { name, code, business_license, food_license, address, contact_name, contact_phone, bank_name, bank_account } = req.body;
    
    const existing = await query('SELECT id FROM suppliers WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json(errorResponse('供应商编码已存在', 400));
    }

    const result = await query(
      'INSERT INTO suppliers (name, code, business_license, food_license, address, contact_name, contact_phone, bank_name, bank_account, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, code, business_license, food_license, address, contact_name, contact_phone, bank_name, bank_account, 'pending']
    );

    res.json(successResponse({ id: result.insertId }, '供应商入驻申请提交成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const list = async (req, res) => {
  try {
    const { page = 1, size = 10, status, keyword } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT * FROM suppliers WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (keyword) {
      sql += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const suppliers = await query(sql, params);
    const count = await query('SELECT COUNT(*) as total FROM suppliers WHERE 1=1' + (status ? ' AND status = ?' : '') + (keyword ? ' AND (name LIKE ? OR code LIKE ?)' : ''), params.slice(0, -2));

    res.json(successResponse({ suppliers, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取供应商列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const suppliers = await query('SELECT * FROM suppliers WHERE id = ?', [id]);
    
    if (suppliers.length === 0) {
      return res.status(404).json(errorResponse('供应商不存在', 404));
    }

    res.json(successResponse(suppliers[0], '获取供应商信息成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { reject_reason } = req.body;
    
    const suppliers = await query('SELECT id, status FROM suppliers WHERE id = ?', [id]);
    if (suppliers.length === 0) {
      return res.status(404).json(errorResponse('供应商不存在', 404));
    }

    if (suppliers[0].status !== 'pending') {
      return res.status(400).json(errorResponse('供应商状态不允许此操作', 400));
    }

    await query('UPDATE suppliers SET status = "approved", reject_reason = ? WHERE id = ?', [reject_reason, id]);
    res.json(successResponse(null, '审核成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reject_reason } = req.body;
    
    if (!reject_reason) {
      return res.status(400).json(errorResponse('请填写驳回原因', 400));
    }

    const suppliers = await query('SELECT id, status FROM suppliers WHERE id = ?', [id]);
    if (suppliers.length === 0) {
      return res.status(404).json(errorResponse('供应商不存在', 404));
    }

    if (suppliers[0].status !== 'pending') {
      return res.status(400).json(errorResponse('供应商状态不允许此操作', 400));
    }

    await query('UPDATE suppliers SET status = "rejected", reject_reason = ? WHERE id = ?', [reject_reason, id]);
    res.json(successResponse(null, '驳回成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatus = ['cooperating', 'suspended', 'terminated'];
    if (!validStatus.includes(status)) {
      return res.status(400).json(errorResponse('无效的状态值', 400));
    }

    const suppliers = await query('SELECT id FROM suppliers WHERE id = ?', [id]);
    if (suppliers.length === 0) {
      return res.status(404).json(errorResponse('供应商不存在', 404));
    }

    await query('UPDATE suppliers SET status = ? WHERE id = ?', [status, id]);
    res.json(successResponse(null, '状态更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, contact_name, contact_phone, bank_name, bank_account } = req.body;

    const suppliers = await query('SELECT id, status FROM suppliers WHERE id = ?', [id]);
    if (suppliers.length === 0) {
      return res.status(404).json(errorResponse('供应商不存在', 404));
    }

    const updateFields = [];
    const params = [];

    if (name) { updateFields.push('name = ?'); params.push(name); }
    if (address) { updateFields.push('address = ?'); params.push(address); }
    if (contact_name) { updateFields.push('contact_name = ?'); params.push(contact_name); }
    if (contact_phone) { updateFields.push('contact_phone = ?'); params.push(contact_phone); }
    if (bank_name) { updateFields.push('bank_name = ?'); params.push(bank_name); }
    if (bank_account) { updateFields.push('bank_account = ?'); params.push(bank_account); }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse('请提供要更新的字段', 400));
    }

    params.push(id);
    await query(`UPDATE suppliers SET ${updateFields.join(', ')} WHERE id = ?`, params);
    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { register, list, getById, approve, reject, updateStatus, update, remove };