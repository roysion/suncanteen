const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, generateInspectionNo, generateInventoryNo, calculateTotalQty } = require('../utils/helpers');

const create = async (req, res) => {
  try {
    const { user } = req;
    const { delivery_id, items, photos, remark } = req.body;
    
    const deliveries = await query('SELECT status, order_id FROM delivery_orders WHERE id = ?', [delivery_id]);
    if (deliveries.length === 0) {
      return res.status(404).json(errorResponse('配送单不存在', 404));
    }

    if (deliveries[0].status !== 'signed') {
      return res.status(400).json(errorResponse('配送单未签收，无法验收', 400));
    }

    const orders = await query('SELECT school_id, supplier_id FROM orders WHERE id = ?', [deliveries[0].order_id]);
    if (orders.length === 0) {
      return res.status(404).json(errorResponse('订单不存在', 404));
    }

    const schoolId = orders[0].school_id;
    const inspectionNo = generateInspectionNo();
    let hasRejected = false;

    const result = await transaction(async (conn) => {
      const [inspectionResult] = await conn.execute(
        'INSERT INTO inspection_orders (inspection_no, delivery_id, order_id, inspector_id, inspection_time, photos, remark) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
        [inspectionNo, delivery_id, deliveries[0].order_id, user.id, JSON.stringify(photos || []), remark]
      );
      const inspectionId = inspectionResult.insertId;

      for (const item of items) {
        const orderItem = await conn.execute('SELECT * FROM order_items WHERE id = ?', [item.order_item_id]);
        if (orderItem[0].length === 0) {
          throw new Error(`订单项不存在`);
        }

        const status = item.status || 'accepted';
        if (status !== 'accepted') hasRejected = true;

        await conn.execute(
          'INSERT INTO inspection_items (inspection_id, order_item_id, kindergarten_qty, primary_qty, junior_qty, senior_qty, status, reject_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [inspectionId, item.order_item_id, item.kindergarten_qty || 0, item.primary_qty || 0, item.junior_qty || 0, item.senior_qty || 0, status, item.reject_reason]
        );

        if (status === 'accepted') {
          const productId = orderItem[0][0].product_id;
          const unitPrice = orderItem[0][0].unit_price;
          const totalQty = calculateTotalQty(item);
          const amount = totalQty * unitPrice;

          const existingInv = await conn.execute('SELECT id, quantity FROM inventory WHERE school_id = ? AND product_id = ?', [schoolId, productId]);
          
          if (existingInv[0].length > 0) {
            await conn.execute('UPDATE inventory SET quantity = quantity + ?, last_update_time = NOW() WHERE id = ?', [totalQty, existingInv[0][0].id]);
          } else {
            await conn.execute('INSERT INTO inventory (school_id, product_id, quantity, cost_price) VALUES (?, ?, ?, ?)', [schoolId, productId, totalQty, unitPrice]);
          }
        }
      }

      const inspectionStatus = hasRejected ? 'partial' : 'passed';
      await conn.execute('UPDATE inspection_orders SET status = ? WHERE id = ?', [inspectionStatus, inspectionId]);
      await conn.execute('UPDATE orders SET status = "inspected" WHERE id = ?', [deliveries[0].order_id]);

      return inspectionId;
    });

    res.json(successResponse({ id: result, inspection_no: inspectionNo }, '验收完成'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message || '服务器内部错误', 500));
  }
};

const list = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, size = 10, delivery_id, status, start_date, end_date } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT i.*, d.delivery_no, o.order_no, u.real_name as inspector_name FROM inspection_orders i LEFT JOIN delivery_orders d ON i.delivery_id = d.id LEFT JOIN orders o ON i.order_id = o.id LEFT JOIN users u ON i.inspector_id = u.id WHERE 1=1';
    const params = [];

    const org = await query('SELECT type FROM organizations WHERE id = ?', [user.organization_id]);
    if (org[0]?.type === 'school') {
      sql += ' AND o.school_id = ?';
      params.push(user.organization_id);
    }

    if (delivery_id) {
      sql += ' AND i.delivery_id = ?';
      params.push(delivery_id);
    }

    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }

    if (start_date) {
      sql += ' AND i.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND i.created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    sql += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const inspections = await query(sql, params);
    const countSql = sql.replace(/ORDER BY.*$/, '');
    const countParams = params.slice(0, -2);
    const count = await query(countSql.replace('SELECT i.*, d.delivery_no, o.order_no, u.real_name as inspector_name', 'SELECT COUNT(*) as total'), countParams);

    res.json(successResponse({ inspections, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取验收单列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const inspections = await query('SELECT i.*, d.delivery_no, o.order_no, o.school_id, u.real_name as inspector_name, org.name as school_name FROM inspection_orders i LEFT JOIN delivery_orders d ON i.delivery_id = d.id LEFT JOIN orders o ON i.order_id = o.id LEFT JOIN users u ON i.inspector_id = u.id LEFT JOIN organizations org ON o.school_id = org.id WHERE i.id = ?', [id]);
    if (inspections.length === 0) {
      return res.status(404).json(errorResponse('验收单不存在', 404));
    }

    const items = await query('SELECT ii.*, oi.product_id, oi.unit_price, p.name as product_name, p.spec, p.unit FROM inspection_items ii LEFT JOIN order_items oi ON ii.order_item_id = oi.id LEFT JOIN products p ON oi.product_id = p.id WHERE ii.inspection_id = ?', [id]);

    res.json(successResponse({ inspection: inspections[0], items }, '获取验收单详情成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { create, list, getById };