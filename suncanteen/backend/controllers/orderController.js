const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, generateOrderNo, calculateTotalQty } = require('../utils/helpers');
const moment = require('moment');

const create = async (req, res) => {
  try {
    const { user } = req;
    const { supplier_id, items, remark } = req.body;
    
    const school = await query('SELECT * FROM organizations WHERE id = ?', [user.organization_id]);
    if (school.length === 0 || school[0].type !== 'school') {
      return res.status(400).json(errorResponse('当前用户所属机构不是学校', 400));
    }

    const supplier = await query('SELECT id, status FROM suppliers WHERE id = ?', [supplier_id]);
    if (supplier.length === 0) {
      return res.status(400).json(errorResponse('供应商不存在', 400));
    }

    if (supplier[0].status !== 'cooperating') {
      return res.status(400).json(errorResponse('供应商状态不允许下单', 400));
    }

    const orderNo = generateOrderNo();
    let totalAmount = 0;

    const result = await transaction(async (conn) => {
      const [orderResult] = await conn.execute(
        'INSERT INTO orders (order_no, school_id, supplier_id, status, remark) VALUES (?, ?, ?, ?, ?)',
        [orderNo, user.organization_id, supplier_id, 'draft', remark]
      );
      const orderId = orderResult.insertId;

      for (const item of items) {
        const product = await conn.execute('SELECT price FROM products WHERE id = ?', [item.product_id]);
        if (product[0].length === 0) {
          throw new Error(`商品ID ${item.product_id}不存在`);
        }

        const unitPrice = product[0][0].price;
        const totalQty = calculateTotalQty(item);
        const amount = totalQty * unitPrice;
        totalAmount += amount;

        await conn.execute(
          'INSERT INTO order_items (order_id, product_id, kindergarten_qty, primary_qty, junior_qty, senior_qty, unit_price, amount, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.kindergarten_qty || 0, item.primary_qty || 0, item.junior_qty || 0, item.senior_qty || 0, unitPrice, amount, item.remark]
        );
      }

      await conn.execute('UPDATE orders SET total_amount = ? WHERE id = ?', [totalAmount, orderId]);
      return orderId;
    });

    res.json(successResponse({ order_id: result, order_no: orderNo }, '订单创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message || '服务器内部错误', 500));
  }
};

const submit = async (req, res) => {
  try {
    const { id } = req.params;
    
    const orders = await query('SELECT status FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json(errorResponse('订单不存在', 404));
    }

    if (orders[0].status !== 'draft') {
      return res.status(400).json(errorResponse('订单状态不允许提交', 400));
    }

    const deadline = await query('SELECT setting_value FROM system_settings WHERE setting_key = "order_deadline"');
    const deadlineTime = deadline[0]?.setting_value || '10:00';
    const now = moment();
    const todayDeadline = moment().hour(parseInt(deadlineTime.split(':')[0])).minute(parseInt(deadlineTime.split(':')[1])).second(0);

    if (now.isAfter(todayDeadline)) {
      return res.status(400).json(errorResponse(`已过今日订单截止时间(${deadlineTime})，无法提交订单`, 400));
    }

    await query('UPDATE orders SET status = "submitted" WHERE id = ?', [id]);
    res.json(successResponse(null, '订单提交成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const confirm = async (req, res) => {
  try {
    const { id } = req.params;
    
    const orders = await query('SELECT status FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json(errorResponse('订单不存在', 404));
    }

    if (orders[0].status !== 'submitted') {
      return res.status(400).json(errorResponse('订单状态不允许确认', 400));
    }

    await query('UPDATE orders SET status = "confirmed" WHERE id = ?', [id]);
    res.json(successResponse(null, '订单确认成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json(errorResponse('请填写驳回原因', 400));
    }

    const orders = await query('SELECT status FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json(errorResponse('订单不存在', 404));
    }

    if (orders[0].status !== 'submitted') {
      return res.status(400).json(errorResponse('订单状态不允许驳回', 400));
    }

    await query('UPDATE orders SET status = "rejected", remark = ? WHERE id = ?', [reason, id]);
    res.json(successResponse(null, '订单驳回成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const list = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, size = 10, status, supplier_id, start_date, end_date } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT o.*, s.name as supplier_name, org.name as school_name FROM orders o LEFT JOIN suppliers s ON o.supplier_id = s.id LEFT JOIN organizations org ON o.school_id = org.id WHERE 1=1';
    const params = [];

    const org = await query('SELECT type FROM organizations WHERE id = ?', [user.organization_id]);
    if (org[0]?.type === 'school') {
      sql += ' AND o.school_id = ?';
      params.push(user.organization_id);
    } else if (org[0]?.type === 'township_center') {
      const schools = await query('SELECT id FROM organizations WHERE parent_id = ?', [user.organization_id]);
      const schoolIds = schools.map(s => s.id).join(',');
      sql += ` AND o.school_id IN (${schoolIds})`;
    }

    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    if (supplier_id) {
      sql += ' AND o.supplier_id = ?';
      params.push(supplier_id);
    }

    if (start_date) {
      sql += ' AND o.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND o.created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const orders = await query(sql, params);
    const countSql = sql.replace(/ORDER BY.*$/, '');
    const countParams = params.slice(0, -2);
    const count = await query(countSql.replace('SELECT o.*, s.name as supplier_name, org.name as school_name', 'SELECT COUNT(*) as total'), countParams);

    res.json(successResponse({ orders, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取订单列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const orders = await query('SELECT o.*, s.name as supplier_name, org.name as school_name, org.stages FROM orders o LEFT JOIN suppliers s ON o.supplier_id = s.id LEFT JOIN organizations org ON o.school_id = org.id WHERE o.id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json(errorResponse('订单不存在', 404));
    }

    const items = await query('SELECT oi.*, p.name as product_name, p.spec, p.unit FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [id]);

    res.json(successResponse({ order: orders[0], items }, '获取订单详情成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, remark } = req.body;

    const orders = await query('SELECT status FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json(errorResponse('订单不存在', 404));
    }

    if (orders[0].status !== 'draft') {
      return res.status(400).json(errorResponse('订单状态不允许修改', 400));
    }

    let totalAmount = 0;

    const result = await transaction(async (conn) => {
      await conn.execute('DELETE FROM order_items WHERE order_id = ?', [id]);

      for (const item of items) {
        const product = await conn.execute('SELECT price FROM products WHERE id = ?', [item.product_id]);
        if (product[0].length === 0) {
          throw new Error(`商品ID ${item.product_id}不存在`);
        }

        const unitPrice = product[0][0].price;
        const totalQty = calculateTotalQty(item);
        const amount = totalQty * unitPrice;
        totalAmount += amount;

        await conn.execute(
          'INSERT INTO order_items (order_id, product_id, kindergarten_qty, primary_qty, junior_qty, senior_qty, unit_price, amount, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, item.product_id, item.kindergarten_qty || 0, item.primary_qty || 0, item.junior_qty || 0, item.senior_qty || 0, unitPrice, amount, item.remark]
        );
      }

      await conn.execute('UPDATE orders SET total_amount = ?, remark = ? WHERE id = ?', [totalAmount, remark, id]);
      return true;
    });

    res.json(successResponse(null, '订单更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message || '服务器内部错误', 500));
  }
};

module.exports = { create, submit, confirm, reject, list, getById, update };