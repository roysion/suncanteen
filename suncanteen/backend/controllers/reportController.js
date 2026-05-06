const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');
const moment = require('moment');

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