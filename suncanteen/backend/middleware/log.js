const { query } = require('../config/database');

const operationLog = async (req, res, next) => {
  const { user } = req;
  const { originalUrl, method, body } = req;
  
  let ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  if (ip === '::1') ip = '127.0.0.1';
  if (ip.startsWith('::ffff:')) ip = ip.substring(7);

  const logData = {
    user_id: user?.id || 0,
    user_name: user?.real_name || '未知用户',
    operation_type: method,
    operation_module: originalUrl.split('/')[1] || '未知',
    operation_detail: JSON.stringify({ path: originalUrl, body: body || {} }),
    ip_address: ip,
    created_at: new Date()
  };

  try {
    await query(
      'INSERT INTO operation_logs (user_id, user_name, operation_type, operation_module, operation_detail, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [logData.user_id, logData.user_name, logData.operation_type, logData.operation_module, logData.operation_detail, logData.ip_address, logData.created_at]
    );
  } catch (error) {
    console.error('Failed to log operation:', error);
  }

  next();
};

module.exports = { operationLog };