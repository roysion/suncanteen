const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');
const moment = require('moment');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const purchaseDetail = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, size = 10, startDate, endDate, supplierId } = req.query;
    const offset = (page - 1) * size;
    
    let sql = `SELECT o.order_no, s.name as supplier_name, p.name as product_name, 
               oi.kindergarten_qty + oi.primary_qty + oi.junior_qty + oi.senior_qty as quantity,
               p.unit, oi.unit_price, oi.amount, o.created_at as order_date
               FROM orders o 
               LEFT JOIN order_items oi ON o.id = oi.order_id 
               LEFT JOIN products p ON oi.product_id = p.id 
               LEFT JOIN suppliers s ON o.supplier_id = s.id
               WHERE o.status = "completed"`;
    
    const params = [];

    if (supplierId) {
      sql += ' AND o.supplier_id = ?';
      params.push(supplierId);
    }

    if (startDate) {
      sql += ' AND o.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND o.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as count FROM');
    const countResult = await query(countSql, params);
    const total = countResult[0].count;

    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const list = await query(sql, params);

    const summarySql = `SELECT SUM(oi.amount) as totalAmount, COUNT(DISTINCT o.id) as orderCount, COUNT(DISTINCT o.supplier_id) as supplierCount
                        FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id
                        WHERE o.status = "completed"`;
    const summaryResult = await query(summarySql, params.slice(0, -2));

    res.json(successResponse({
      list,
      total,
      page: parseInt(page),
      summary: {
        totalAmount: parseFloat(summaryResult[0].totalAmount) || 0,
        orderCount: summaryResult[0].orderCount || 0,
        supplierCount: summaryResult[0].supplierCount || 0
      }
    }, '获取采购明细成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const exportPurchase = async (req, res) => {
  try {
    const { startDate, endDate, supplierId } = req.query;
    
    let sql = `SELECT o.order_no, s.name as supplier_name, p.name as product_name, 
               oi.kindergarten_qty + oi.primary_qty + oi.junior_qty + oi.senior_qty as quantity,
               p.unit, oi.unit_price, oi.amount, o.created_at as order_date
               FROM orders o 
               LEFT JOIN order_items oi ON o.id = oi.order_id 
               LEFT JOIN products p ON oi.product_id = p.id 
               LEFT JOIN suppliers s ON o.supplier_id = s.id
               WHERE o.status = "completed"`;
    
    const params = [];

    if (supplierId) {
      sql += ' AND o.supplier_id = ?';
      params.push(supplierId);
    }

    if (startDate) {
      sql += ' AND o.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND o.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    sql += ' ORDER BY o.created_at DESC';
    const data = await query(sql, params);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '采购报表');
    
    const filename = `采购报表_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    const filepath = path.join(__dirname, '../exports', filename);
    
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }
    
    XLSX.writeFile(workbook, filepath);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        res.status(500).json(errorResponse('导出失败', 500));
      }
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const inventoryDetail = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, size = 10, reportDate, warehouseId } = req.query;
    const offset = (page - 1) * size;
    
    let sql = `SELECT p.name as product_name, p.spec, p.unit, inv.quantity, 
               inv.cost_price, inv.quantity * inv.cost_price as total_value,
               w.name as warehouse_name
               FROM inventory inv 
               LEFT JOIN products p ON inv.product_id = p.id
               LEFT JOIN warehouses w ON inv.warehouse_id = w.id
               WHERE inv.school_id = ?`;
    
    const params = [user.organization_id];

    if (warehouseId) {
      sql += ' AND inv.warehouse_id = ?';
      params.push(warehouseId);
    }

    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as count FROM');
    const countResult = await query(countSql, params);
    const total = countResult[0].count;

    sql += ' ORDER BY total_value DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const list = await query(sql, params);
    
    list.forEach(item => {
      const warningQty = 100;
      const shortageQty = 50;
      if (item.quantity <= shortageQty) {
        item.stock_status = 'shortage';
      } else if (item.quantity <= warningQty) {
        item.stock_status = 'warning';
      } else {
        item.stock_status = 'normal';
      }
    });

    const summarySql = `SELECT SUM(inv.quantity) as totalQuantity, SUM(inv.quantity * inv.cost_price) as totalValue, COUNT(DISTINCT inv.product_id) as productCount
                        FROM inventory inv WHERE inv.school_id = ?`;
    const summaryResult = await query(summarySql, [user.organization_id]);

    res.json(successResponse({
      list,
      total,
      page: parseInt(page),
      summary: {
        totalValue: parseFloat(summaryResult[0].totalValue) || 0,
        productCount: summaryResult[0].productCount || 0,
        totalQuantity: summaryResult[0].totalQuantity || 0
      }
    }, '获取库存明细成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const exportInventory = async (req, res) => {
  try {
    const { user } = req;
    const { reportDate, warehouseId } = req.query;
    
    let sql = `SELECT p.name as product_name, p.spec, p.unit, inv.quantity, 
               inv.cost_price, inv.quantity * inv.cost_price as total_value,
               w.name as warehouse_name
               FROM inventory inv 
               LEFT JOIN products p ON inv.product_id = p.id
               LEFT JOIN warehouses w ON inv.warehouse_id = w.id
               WHERE inv.school_id = ?`;
    
    const params = [user.organization_id];

    if (warehouseId) {
      sql += ' AND inv.warehouse_id = ?';
      params.push(warehouseId);
    }

    sql += ' ORDER BY total_value DESC';
    const data = await query(sql, params);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '库存报表');
    
    const filename = `库存报表_${moment().format('YYYYMMDD_HHmmss')}.xlsx`;
    const filepath = path.join(__dirname, '../exports', filename);
    
    if (!fs.existsSync(path.dirname(filepath))) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }
    
    XLSX.writeFile(workbook, filepath);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        res.status(500).json(errorResponse('导出失败', 500));
      }
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getSuppliers = async (req, res) => {
  try {
    const data = await query('SELECT id, name FROM suppliers WHERE status = "approved" ORDER BY name');
    res.json(successResponse(data, '获取供应商列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getWarehouses = async (req, res) => {
  try {
    const { user } = req;
    const data = await query('SELECT id, name FROM warehouses WHERE school_id = ? ORDER BY name', [user.organization_id]);
    res.json(successResponse(data, '获取仓库列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const purchaseAnalysis = async (req, res) => {
  try {
    const { user } = req;
    const { start_date, end_date, school_id, category_id } = req.query;
    
    let sql = `SELECT o.school_id, org.name as school_name, p.category_id, pc.name as category_name, 
               SUM(oi.amount) as total_amount, SUM(oi.kindergarten_qty + oi.primary_qty + oi.junior_qty + oi.senior_qty) as total_qty,
               COUNT(DISTINCT o.id) as order_count
               FROM orders o 
               LEFT JOIN order_items oi ON o.id = oi.order_id 
               LEFT JOIN products p ON oi.product_id = p.id 
               LEFT JOIN product_categories pc ON p.category_id = pc.id
               LEFT JOIN organizations org ON o.school_id = org.id
               WHERE o.status = "completed"`;
    
    const params = [];

    const org = await query('SELECT type FROM organizations WHERE id = ?', [user.organization_id]);
    if (org[0]?.type === 'school') {
      sql += ' AND o.school_id = ?';
      params.push(user.organization_id);
    }

    if (school_id) {
      sql += ' AND o.school_id = ?';
      params.push(school_id);
    }

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (start_date) {
      sql += ' AND o.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND o.created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }

    sql += ' GROUP BY o.school_id, p.category_id ORDER BY total_amount DESC';

    const data = await query(sql, params);
    res.json(successResponse(data, '获取采购分析成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const inventoryAnalysis = async (req, res) => {
  try {
    const { user } = req;
    
    const sql = `SELECT inv.product_id, p.name as product_name, p.spec, p.unit,
                 SUM(inv.quantity) as total_quantity, SUM(inv.quantity * inv.cost_price) as total_value
                 FROM inventory inv 
                 LEFT JOIN products p ON inv.product_id = p.id
                 WHERE inv.school_id = ? AND inv.quantity > 0
                 GROUP BY inv.product_id ORDER BY total_value DESC`;

    const data = await query(sql, [user.organization_id]);
    res.json(successResponse(data, '获取库存分析成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const dashboard = async (req, res) => {
  try {
    const { user } = req;
    const org = await query('SELECT type FROM organizations WHERE id = ?', [user.organization_id]);
    
    let schoolCondition = '';
    const params = [];

    if (org[0]?.type === 'school') {
      schoolCondition = 'AND o.school_id = ?';
      params.push(user.organization_id);
    }

    const today = moment().format('YYYY-MM-DD');
    
    const todayOrders = await query(`SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as amount FROM orders WHERE DATE(created_at) = ? AND status = "submitted" ${schoolCondition}`, [today, ...params]);
    
    const pendingOrders = await query(`SELECT COUNT(*) as count FROM orders WHERE status = "submitted" ${schoolCondition}`, params);
    
    const monthlyPurchases = await query(`SELECT SUM(total_amount) as amount FROM orders WHERE DATE_FORMAT(created_at, "%Y-%m") = ? AND status = "completed" ${schoolCondition}`, [moment().format('YYYY-MM'), ...params]);
    
    const inventoryValue = await query(`SELECT COALESCE(SUM(quantity * cost_price), 0) as value FROM inventory WHERE school_id = ?`, [user.organization_id]);

    const dashboardData = {
      todayOrders: todayOrders[0].count,
      todayAmount: parseFloat(todayOrders[0].amount),
      pendingOrders: pendingOrders[0].count,
      monthlyPurchases: parseFloat(monthlyPurchases[0].amount),
      inventoryValue: parseFloat(inventoryValue[0].value)
    };

    res.json(successResponse(dashboardData, '获取仪表盘数据成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { purchaseAnalysis, inventoryAnalysis, dashboard };