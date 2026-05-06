const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, generateSettlementNo } = require('../utils/helpers');
const moment = require('moment');

const createMonthly = async (req, res) => {
  try {
    const { school_id, supplier_id, period } = req.body;
    
    const settlementNo = generateSettlementNo('monthly', period);
    
    const result = await transaction(async (conn) => {
      const orders = await conn.execute(
        'SELECT id, total_amount FROM orders WHERE school_id = ? AND supplier_id = ? AND status = "completed" AND DATE_FORMAT(created_at, "%Y-%m") = ?',
        [school_id, supplier_id, period]
      );

      const returnAmount = await conn.execute(
        'SELECT COALESCE(SUM(total_amount), 0) as total FROM returns WHERE order_id IN (SELECT id FROM orders WHERE school_id = ? AND supplier_id = ? AND status = "completed" AND DATE_FORMAT(created_at, "%Y-%m") = ?) AND status = "completed"',
        [school_id, supplier_id, period]
      );

      const totalAmount = orders[0].reduce((sum, o) => sum + o.total_amount, 0);
      const actualAmount = totalAmount - returnAmount[0][0].total;

      const [settlementResult] = await conn.execute(
        'INSERT INTO settlements (settlement_no, school_id, supplier_id, type, period, total_amount, return_amount, actual_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [settlementNo, school_id, supplier_id, 'monthly', period, totalAmount, returnAmount[0][0].total, actualAmount]
      );
      const settlementId = settlementResult.insertId;

      for (const order of orders[0]) {
        const orderReturns = await conn.execute(
          'SELECT COALESCE(SUM(total_amount), 0) as total FROM returns WHERE order_id = ? AND status = "completed"',
          [order.id]
        );
        await conn.execute(
          'INSERT INTO settlement_items (settlement_id, order_id, amount, return_amount) VALUES (?, ?, ?, ?)',
          [settlementId, order.id, order.total_amount, orderReturns[0][0].total]
        );
      }

      return settlementId;
    });

    res.json(successResponse({ id: result, settlement_no: settlementNo }, '月结单创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const confirm = async (req, res) => {
  try {
    const { id } = req.params;
    
    const settlements = await query('SELECT status FROM settlements WHERE id = ?', [id]);
    if (settlements.length === 0) {
      return res.status(404).json(errorResponse('结算单不存在', 404));
    }

    if (settlements[0].status !== 'draft') {
      return res.status(400).json(errorResponse('结算单状态不允许确认', 400));
    }

    await query('UPDATE settlements SET status = "confirmed" WHERE id = ?', [id]);
    res.json(successResponse(null, '确认成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const list = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, size = 10, type, period, status, school_id, supplier_id } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT s.*, org.name as school_name, sup.name as supplier_name FROM settlements s LEFT JOIN organizations org ON s.school_id = org.id LEFT JOIN suppliers sup ON s.supplier_id = sup.id WHERE 1=1';
    const params = [];

    const org = await query('SELECT type FROM organizations WHERE id = ?', [user.organization_id]);
    if (org[0]?.type === 'school') {
      sql += ' AND s.school_id = ?';
      params.push(user.organization_id);
    }

    if (type) {
      sql += ' AND s.type = ?';
      params.push(type);
    }

    if (period) {
      sql += ' AND s.period LIKE ?';
      params.push(`%${period}%`);
    }

    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    if (school_id) {
      sql += ' AND s.school_id = ?';
      params.push(school_id);
    }

    if (supplier_id) {
      sql += ' AND s.supplier_id = ?';
      params.push(supplier_id);
    }

    sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const settlements = await query(sql, params);
    const countSql = sql.replace(/ORDER BY.*$/, '');
    const countParams = params.slice(0, -2);
    const count = await query(countSql.replace('SELECT s.*, org.name as school_name, sup.name as supplier_name', 'SELECT COUNT(*) as total'), countParams);

    res.json(successResponse({ settlements, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取结算单列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const settlements = await query('SELECT s.*, org.name as school_name, sup.name as supplier_name FROM settlements s LEFT JOIN organizations org ON s.school_id = org.id LEFT JOIN suppliers sup ON s.supplier_id = sup.id WHERE s.id = ?', [id]);
    if (settlements.length === 0) {
      return res.status(404).json(errorResponse('结算单不存在', 404));
    }

    const items = await query('SELECT si.*, o.order_no, o.created_at as order_date FROM settlement_items si LEFT JOIN orders o ON si.order_id = o.id WHERE si.settlement_id = ?', [id]);

    res.json(successResponse({ settlement: settlements[0], items }, '获取结算单详情成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { createMonthly, confirm, list, getById };