const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, generateDeliveryNo } = require('../utils/helpers');

const create = async (req, res) => {
  try {
    const { order_id, driver_name, driver_phone, vehicle_no, vehicle_temp } = req.body;
    
    const orders = await query('SELECT status FROM orders WHERE id = ?', [order_id]);
    if (orders.length === 0) {
      return res.status(404).json(errorResponse('订单不存在', 404));
    }

    if (orders[0].status !== 'confirmed') {
      return res.status(400).json(errorResponse('订单状态不允许创建配送单', 400));
    }

    const deliveryNo = generateDeliveryNo();
    
    const result = await query(
      'INSERT INTO delivery_orders (delivery_no, order_id, driver_name, driver_phone, vehicle_no, vehicle_temp, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [deliveryNo, order_id, driver_name, driver_phone, vehicle_no, vehicle_temp, 'delivering']
    );

    await query('UPDATE orders SET status = "delivering" WHERE id = ?', [order_id]);

    res.json(successResponse({ id: result.insertId, delivery_no: deliveryNo }, '配送单创建成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const list = async (req, res) => {
  try {
    const { page = 1, size = 10, order_id, status } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT d.*, o.order_no, s.name as supplier_name, org.name as school_name FROM delivery_orders d LEFT JOIN orders o ON d.order_id = o.id LEFT JOIN suppliers s ON o.supplier_id = s.id LEFT JOIN organizations org ON o.school_id = org.id WHERE 1=1';
    const params = [];

    if (order_id) {
      sql += ' AND d.order_id = ?';
      params.push(order_id);
    }

    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const deliveries = await query(sql, params);
    const countSql = sql.replace(/ORDER BY.*$/, '');
    const countParams = params.slice(0, -2);
    const count = await query(countSql.replace('SELECT d.*, o.order_no, s.name as supplier_name, org.name as school_name', 'SELECT COUNT(*) as total'), countParams);

    res.json(successResponse({ deliveries, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取配送单列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deliveries = await query('SELECT d.*, o.order_no, o.school_id, s.name as supplier_name, org.name as school_name, org.stages FROM delivery_orders d LEFT JOIN orders o ON d.order_id = o.id LEFT JOIN suppliers s ON o.supplier_id = s.id LEFT JOIN organizations org ON o.school_id = org.id WHERE d.id = ?', [id]);
    if (deliveries.length === 0) {
      return res.status(404).json(errorResponse('配送单不存在', 404));
    }

    const orderItems = await query('SELECT oi.*, p.name as product_name, p.spec, p.unit FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [deliveries[0].order_id]);

    res.json(successResponse({ delivery: deliveries[0], items: orderItems }, '获取配送单详情成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const sign = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deliveries = await query('SELECT status, order_id FROM delivery_orders WHERE id = ?', [id]);
    if (deliveries.length === 0) {
      return res.status(404).json(errorResponse('配送单不存在', 404));
    }

    if (deliveries[0].status !== 'delivering') {
      return res.status(400).json(errorResponse('配送单状态不允许签收', 400));
    }

    await query('UPDATE delivery_orders SET status = "signed", sign_time = NOW() WHERE id = ?', [id]);
    await query('UPDATE orders SET status = "delivered" WHERE id = ?', [deliveries[0].order_id]);

    res.json(successResponse(null, '签收成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { create, list, getById, sign };