const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, generateReturnNo, calculateTotalQty } = require('../utils/helpers');

const create = async (req, res) => {
  try {
    const { user } = req;
    const { order_id, type, items, reason } = req.body;
    
    const orders = await query('SELECT status, school_id FROM orders WHERE id = ?', [order_id]);
    if (orders.length === 0) {
      return res.status(404).json(errorResponse('订单不存在', 404));
    }

    if (orders[0].status !== 'inspected') {
      return res.status(400).json(errorResponse('订单未验收完成，无法发起退换货', 400));
    }

    const returnNo = generateReturnNo();
    let totalAmount = 0;

    const result = await transaction(async (conn) => {
      const [returnResult] = await conn.execute(
        'INSERT INTO returns (return_no, order_id, type, reason, created_by) VALUES (?, ?, ?, ?, ?)',
        [returnNo, order_id, type, reason, user.id]
      );
      const returnId = returnResult.insertId;

      for (const item of items) {
        const orderItem = await conn.execute('SELECT product_id, unit_price FROM order_items WHERE id = ?', [item.order_item_id]);
        if (orderItem[0].length === 0) {
          throw new Error('订单项不存在');
        }

        const totalQty = calculateTotalQty(item);
        const amount = totalQty * orderItem[0][0].unit_price;
        totalAmount += amount;

        await conn.execute(
          'INSERT INTO return_items (return_id, order_item_id, kindergarten_qty, primary_qty, junior_qty, senior_qty, unit_price, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [returnId, item.order_item_id, item.kindergarten_qty || 0, item.primary_qty || 0, item.junior_qty || 0, item.senior_qty || 0, orderItem[0][0].unit_price, amount]
        );

        await conn.execute('UPDATE inventory SET quantity = quantity - ?, last_update_time = NOW() WHERE school_id = ? AND product_id = ?', [totalQty, orders[0].school_id, orderItem[0][0].product_id]);
      }

      await conn.execute('UPDATE returns SET total_amount = ? WHERE id = ?', [totalAmount, returnId]);
      return returnId;
    });

    res.json(successResponse({ id: result, return_no: returnNo }, '退换货申请提交成功'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message || '服务器内部错误', 500));
  }
};

const approve = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    const returns = await query('SELECT status, order_id FROM returns WHERE id = ?', [id]);
    if (returns.length === 0) {
      return res.status(404).json(errorResponse('退换货单不存在', 404));
    }

    if (returns[0].status !== 'pending') {
      return res.status(400).json(errorResponse('退换货单状态不允许此操作', 400));
    }

    await query('UPDATE returns SET status = "approved", approved_by = ?, approved_at = NOW() WHERE id = ?', [user.id, id]);
    res.json(successResponse(null, '审核通过'));
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

    const returns = await query('SELECT status FROM returns WHERE id = ?', [id]);
    if (returns.length === 0) {
      return res.status(404).json(errorResponse('退换货单不存在', 404));
    }

    if (returns[0].status !== 'pending') {
      return res.status(400).json(errorResponse('退换货单状态不允许此操作', 400));
    }

    await query('UPDATE returns SET status = "rejected", reason = CONCAT(reason, " [驳回原因:", ?, "]") WHERE id = ?', [reason, id]);
    res.json(successResponse(null, '驳回成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const complete = async (req, res) => {
  try {
    const { id } = req.params;
    
    const returns = await query('SELECT status FROM returns WHERE id = ?', [id]);
    if (returns.length === 0) {
      return res.status(404).json(errorResponse('退换货单不存在', 404));
    }

    if (returns[0].status !== 'approved') {
      return res.status(400).json(errorResponse('退换货单状态不允许此操作', 400));
    }

    await query('UPDATE returns SET status = "completed" WHERE id = ?', [id]);
    res.json(successResponse(null, '退换货完成'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const list = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, size = 10, status, order_id } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT r.*, o.order_no, u.real_name as created_name FROM returns r LEFT JOIN orders o ON r.order_id = o.id LEFT JOIN users u ON r.created_by = u.id WHERE 1=1';
    const params = [];

    const org = await query('SELECT type FROM organizations WHERE id = ?', [user.organization_id]);
    if (org[0]?.type === 'school') {
      sql += ' AND o.school_id = ?';
      params.push(user.organization_id);
    }

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    if (order_id) {
      sql += ' AND r.order_id = ?';
      params.push(order_id);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const returns = await query(sql, params);
    const countSql = sql.replace(/ORDER BY.*$/, '');
    const countParams = params.slice(0, -2);
    const count = await query(countSql.replace('SELECT r.*, o.order_no, u.real_name as created_name', 'SELECT COUNT(*) as total'), countParams);

    res.json(successResponse({ returns, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取退换货列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const returns = await query('SELECT r.*, o.order_no, o.school_id, u.real_name as created_name FROM returns r LEFT JOIN orders o ON r.order_id = o.id LEFT JOIN users u ON r.created_by = u.id WHERE r.id = ?', [id]);
    if (returns.length === 0) {
      return res.status(404).json(errorResponse('退换货单不存在', 404));
    }

    const items = await query('SELECT ri.*, oi.product_id, p.name as product_name, p.spec, p.unit FROM return_items ri LEFT JOIN order_items oi ON ri.order_item_id = oi.id LEFT JOIN products p ON oi.product_id = p.id WHERE ri.return_id = ?', [id]);

    res.json(successResponse({ return: returns[0], items }, '获取退换货单详情成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { create, approve, reject, complete, list, getById };