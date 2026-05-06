const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const moment = require('moment');

const generateToken = (userId, username, roleId) => {
  const payload = { userId, username, roleId };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const generateOrderNo = () => {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PO${timestamp}${random}`;
};

const generateDeliveryNo = () => {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DL${timestamp}${random}`;
};

const generateInspectionNo = () => {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `IN${timestamp}${random}`;
};

const generateSettlementNo = (type, period) => {
  const prefix = type === 'monthly' ? 'SM' : 'ST';
  const periodStr = period.replace(/[^0-9]/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${periodStr}${random}`;
};

const generateInventoryNo = (type) => {
  const prefix = type === 'in' ? 'INVIN' : 'INVOUT';
  const timestamp = moment().format('YYYYMMDD');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const generateReturnNo = () => {
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RT${timestamp}${random}`;
};

const formatAmount = (amount) => {
  return parseFloat(amount).toFixed(2);
};

const calculateTotalQty = (item) => {
  return (item.kindergarten_qty || 0) + (item.primary_qty || 0) + (item.junior_qty || 0) + (item.senior_qty || 0);
};

const getStagesFromSchool = (school) => {
  if (!school.stages) return [];
  try {
    return JSON.parse(school.stages);
  } catch {
    return [];
  }
};

const successResponse = (data, message = '操作成功') => {
  return { success: true, message, data };
};

const errorResponse = (message = '操作失败', code = 500) => {
  return { success: false, message, code };
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateOrderNo,
  generateDeliveryNo,
  generateInspectionNo,
  generateSettlementNo,
  generateInventoryNo,
  generateReturnNo,
  formatAmount,
  calculateTotalQty,
  getStagesFromSchool,
  successResponse,
  errorResponse
};