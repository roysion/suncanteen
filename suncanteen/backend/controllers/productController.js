const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

const create = async (req, res) => {
  try {
    const { supplier_id, category_id, name, spec, origin, unit, price, image_url, video_url, description } = req.body;
    
    const supplier = await query('SELECT id, status FROM suppliers WHERE id = ?', [supplier_id]);
    if (supplier.length === 0) {
      return res.status(400).json(errorResponse('供应商不存在', 400));
    }

    if (supplier[0].status !== 'cooperating') {
      return res.status(400).json(errorResponse('供应商状态不允许添加商品', 400));
    }

    const result = await query(
      'INSERT INTO products (supplier_id, category_id, name, spec, origin, unit, price, image_url, video_url, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [supplier_id, category_id, name, spec, origin, unit, price, image_url, video_url, description]
    );

    res.json(successResponse({ id: result.insertId }, '商品添加成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const list = async (req, res) => {
  try {
    const { page = 1, size = 10, category_id, supplier_id, keyword } = req.query;
    const offset = (page - 1) * size;
    
    let sql = 'SELECT p.*, s.name as supplier_name, c.name as category_name FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id LEFT JOIN product_categories c ON p.category_id = c.id WHERE p.status = "active"';
    const params = [];

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (supplier_id) {
      sql += ' AND p.supplier_id = ?';
      params.push(supplier_id);
    }

    if (keyword) {
      sql += ' AND (p.name LIKE ? OR p.spec LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(size), parseInt(offset));

    const products = await query(sql, params);
    const count = await query('SELECT COUNT(*) as total FROM products WHERE status = "active"' + (category_id ? ' AND category_id = ?' : '') + (supplier_id ? ' AND supplier_id = ?' : '') + (keyword ? ' AND (name LIKE ? OR spec LIKE ?)' : ''), params.slice(0, -2));

    res.json(successResponse({ products, total: count[0].total, page: parseInt(page), size: parseInt(size) }, '获取商品列表成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await query('SELECT p.*, s.name as supplier_name, c.name as category_name FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id LEFT JOIN product_categories c ON p.category_id = c.id WHERE p.id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json(errorResponse('商品不存在', 404));
    }

    res.json(successResponse(products[0], '获取商品信息成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, spec, origin, unit, price, image_url, video_url, description } = req.body;

    const products = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json(errorResponse('商品不存在', 404));
    }

    const updateFields = [];
    const params = [];

    if (category_id) { updateFields.push('category_id = ?'); params.push(category_id); }
    if (name) { updateFields.push('name = ?'); params.push(name); }
    if (spec) { updateFields.push('spec = ?'); params.push(spec); }
    if (origin) { updateFields.push('origin = ?'); params.push(origin); }
    if (unit) { updateFields.push('unit = ?'); params.push(unit); }
    if (price) { updateFields.push('price = ?'); params.push(price); }
    if (image_url) { updateFields.push('image_url = ?'); params.push(image_url); }
    if (video_url) { updateFields.push('video_url = ?'); params.push(video_url); }
    if (description) { updateFields.push('description = ?'); params.push(description); }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse('请提供要更新的字段', 400));
    }

    params.push(id);
    await query(`UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`, params);
    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE products SET status = "inactive" WHERE id = ?', [id]);
    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const listCategories = async (req, res) => {
  try {
    const categories = await query('SELECT * FROM product_categories WHERE status = "active" ORDER BY sort_order, id');
    res.json(successResponse(categories, '获取商品分类成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, parent_id, sort_order } = req.body;
    
    const result = await query(
      'INSERT INTO product_categories (name, parent_id, sort_order) VALUES (?, ?, ?)',
      [name, parent_id || null, sort_order || 0]
    );

    res.json(successResponse({ id: result.insertId }, '分类添加成功'));
  } catch (error) {
    res.status(500).json(errorResponse('服务器内部错误', 500));
  }
};

module.exports = { create, list, getById, update, remove, listCategories, createCategory };