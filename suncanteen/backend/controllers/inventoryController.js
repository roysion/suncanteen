const { query, transaction } = require('../config/database');
const { successResponse, errorResponse, generateInventoryNo, calculateTotalQty } = require('../utils/helpers');

const list = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, size = 10, product_id, keyword } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT inv.*, p.name as product_name, p.spec, p.unit FROM inventory inv LEFT JOIN products p ON inv.product_id = p.id WHERE inv.school_id = ? AND inv.quantity > 0';
    const params = [user.organization_id];

    if (product_id) {
      sql += ' AND inv.product_id = ?';
      params.push(product_id);
    }

    if (keyword) {
      sql += ' AND (p.name LIKE ? OR p.spec LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY inv.last_update_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const inventory = await query(sql, params);
    const count = await query('SELECT COUNT(*) as total FROM inventory WHERE school_id = ? AND quantity > 0' + (product_id ? ' AND product_id = ?' : '') + (keyword ? ' AND (SELECT name FROM products WHERE id = product_id) LIKE ? OR (SELECT spec FROM products WHERE id = product_id) LIKE ?' : ''), params.slice(0, -2));

    res.json(successResponse({ inventory, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取库存列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const inventory = await query('SELECT inv.*, p.name as product_name, p.spec, p.unit FROM inventory inv LEFT JOIN products p ON inv.product_id = p.id WHERE inv.id = ?', [id]);
    if (inventory.length === 0) {
      return res.status(404).json(errorResponse('库存记录不存在', 404));
    }

    res.json(successResponse(inventory[0], '获取库存详情成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const createOut = async (req, res) => {
  try {
    const { user } = req;
    const { items, purpose, remark } = req.body;
    
    const inventoryNo = generateInventoryNo('out');
    let totalAmount = 0;

    const result = await transaction(async (conn) => {
      const [outResult] = await conn.execute(
        'INSERT INTO inventory_out (inventory_no, school_id, purpose, operator_id, remark) VALUES (?, ?, ?, ?, ?)',
        [inventoryNo, user.organization_id, purpose, user.id, remark]
      );
      const outId = outResult.insertId;

      for (const item of items) {
        const inv = await conn.execute('SELECT quantity, cost_price FROM inventory WHERE school_id = ? AND product_id = ?', [user.organization_id, item.product_id]);
        if (inv[0].length === 0 || inv[0][0].quantity < item.quantity) {
          throw new Error('库存不足');
        }

        const amount = item.quantity * inv[0][0].cost_price;
        totalAmount += amount;

        await conn.execute('UPDATE inventory SET quantity = quantity - ?, last_update_time = NOW() WHERE school_id = ? AND product_id = ?', [item.quantity, user.organization_id, item.product_id]);
        
        await conn.execute(
          'INSERT INTO inventory_out_items (inventory_out_id, product_id, quantity, unit_price, amount) VALUES (?, ?, ?, ?, ?)',
          [outId, item.product_id, item.quantity, inv[0][0].cost_price, amount]
        );
      }

      await conn.execute('UPDATE inventory_out SET total_amount = ? WHERE id = ?', [totalAmount, outId]);
      return outId;
    });

    res.json(successResponse({ id: result, inventory_no: inventoryNo }, '出库成功'));
  } catch (error) {
    res.status(500).json(errorResponse(error.message || '服务器内部错误', 500));
  }
};

const check = async (req, res) => {
  try {
    const { user } = req;
    const { items, remark } = req.body;
    
    const result = await transaction(async (conn) => {
      for (const item of items) {
        const inv = await conn.execute('SELECT quantity FROM inventory WHERE school_id = ? AND product_id = ?', [user.organization_id, item.product_id]);
        
        if (inv[0].length > 0) {
          const diff = item.actual_qty - inv[0][0].quantity;
          if (diff !== 0) {
            await conn.execute('UPDATE inventory SET quantity = ?, last_update_time = NOW() WHERE school_id = ? AND product_id = ?', [item.actual_qty, user.organization_id, item.product_id]);
          }
        }
      }
      return true;
    });

    res.json(successResponse(null, '盘点完成'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const listOut = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, size = 10, start_date, end_date } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT io.*, u.real_name as operator_name FROM inventory_out io LEFT JOIN users u ON io.operator_id = u.id WHERE io.school_id = ?';
    const params = [user.organization_id];

    if (start_date) {
      sql += ' AND io.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND io.created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    sql += ' ORDER BY io.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const records = await query(sql, params);
    const count = await query('SELECT COUNT(*) as total FROM inventory_out WHERE school_id = ?' + (start_date ? ' AND created_at >= ?' : '') + (end_date ? ' AND created_at <= ?' : ''), params.slice(0, -2));

    res.json(successResponse({ records, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取出库记录成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { list, getById, createOut, check, listOut };