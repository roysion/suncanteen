CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('education_bureau', 'township_center', 'school') NOT NULL,
  parent_id INT DEFAULT NULL,
  address VARCHAR(500),
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  stages JSON DEFAULT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  permissions JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  real_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  organization_id INT NOT NULL,
  role_id INT NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  last_login_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  business_license VARCHAR(255),
  food_license VARCHAR(255),
  address VARCHAR(500),
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  bank_name VARCHAR(100),
  bank_account VARCHAR(100),
  status ENUM('pending', 'approved', 'rejected', 'cooperating', 'suspended', 'terminated') DEFAULT 'pending',
  reject_reason VARCHAR(500),
  agreement_signed BOOLEAN DEFAULT FALSE,
  agreement_file VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INT DEFAULT NULL,
  sort_order INT DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES product_categories(id)
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  category_id INT,
  name VARCHAR(255) NOT NULL,
  spec VARCHAR(100),
  origin VARCHAR(100),
  unit VARCHAR(20) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(500),
  video_url VARCHAR(500),
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (category_id) REFERENCES product_categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  school_id INT NOT NULL,
  supplier_id INT NOT NULL,
  status ENUM('draft', 'submitted', 'confirmed', 'delivering', 'delivered', 'inspected', 'completed', 'cancelled', 'rejected') DEFAULT 'draft',
  total_amount DECIMAL(12,2) DEFAULT 0,
  remark VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES organizations(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  kindergarten_qty DECIMAL(10,2) DEFAULT 0,
  primary_qty DECIMAL(10,2) DEFAULT 0,
  junior_qty DECIMAL(10,2) DEFAULT 0,
  senior_qty DECIMAL(10,2) DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  remark VARCHAR(200),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS delivery_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_no VARCHAR(50) UNIQUE NOT NULL,
  order_id INT NOT NULL,
  driver_name VARCHAR(100),
  driver_phone VARCHAR(20),
  vehicle_no VARCHAR(20),
  vehicle_temp DECIMAL(5,1),
  delivery_time DATETIME,
  sign_time DATETIME,
  status ENUM('pending', 'delivering', 'delivered', 'signed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS inspection_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_no VARCHAR(50) UNIQUE NOT NULL,
  delivery_id INT NOT NULL,
  order_id INT NOT NULL,
  inspector_id INT NOT NULL,
  inspection_time DATETIME NOT NULL,
  photos JSON,
  status ENUM('pending', 'passed', 'partial', 'rejected') DEFAULT 'pending',
  remark VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (delivery_id) REFERENCES delivery_orders(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (inspector_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS inspection_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_id INT NOT NULL,
  order_item_id INT NOT NULL,
  kindergarten_qty DECIMAL(10,2) DEFAULT 0,
  primary_qty DECIMAL(10,2) DEFAULT 0,
  junior_qty DECIMAL(10,2) DEFAULT 0,
  senior_qty DECIMAL(10,2) DEFAULT 0,
  status ENUM('accepted', 'rejected', 'partial') DEFAULT 'accepted',
  reject_reason VARCHAR(200),
  FOREIGN KEY (inspection_id) REFERENCES inspection_orders(id),
  FOREIGN KEY (order_item_id) REFERENCES order_items(id)
);

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(12,2) DEFAULT 0,
  cost_price DECIMAL(10,2) DEFAULT 0,
  last_update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES organizations(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE KEY (school_id, product_id)
);

CREATE TABLE IF NOT EXISTS inventory_in (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_no VARCHAR(50) UNIQUE NOT NULL,
  school_id INT NOT NULL,
  source_type ENUM('purchase', 'return', 'adjustment') NOT NULL,
  source_id INT,
  total_amount DECIMAL(12,2) DEFAULT 0,
  operator_id INT NOT NULL,
  remark VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES organizations(id),
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS inventory_in_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_in_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (inventory_in_id) REFERENCES inventory_in(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS inventory_out (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_no VARCHAR(50) UNIQUE NOT NULL,
  school_id INT NOT NULL,
  purpose VARCHAR(100),
  total_amount DECIMAL(12,2) DEFAULT 0,
  operator_id INT NOT NULL,
  remark VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES organizations(id),
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS inventory_out_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventory_out_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (inventory_out_id) REFERENCES inventory_out(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_no VARCHAR(50) UNIQUE NOT NULL,
  order_id INT NOT NULL,
  type ENUM('return', 'exchange') DEFAULT 'return',
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  total_amount DECIMAL(12,2) DEFAULT 0,
  reason VARCHAR(500),
  created_by INT NOT NULL,
  approved_by INT,
  approved_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS return_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_id INT NOT NULL,
  order_item_id INT NOT NULL,
  kindergarten_qty DECIMAL(10,2) DEFAULT 0,
  primary_qty DECIMAL(10,2) DEFAULT 0,
  junior_qty DECIMAL(10,2) DEFAULT 0,
  senior_qty DECIMAL(10,2) DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (order_item_id) REFERENCES order_items(id)
);

CREATE TABLE IF NOT EXISTS settlements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  settlement_no VARCHAR(50) UNIQUE NOT NULL,
  school_id INT NOT NULL,
  supplier_id INT NOT NULL,
  type ENUM('monthly', 'term') NOT NULL,
  period VARCHAR(50) NOT NULL,
  total_amount DECIMAL(12,2) DEFAULT 0,
  return_amount DECIMAL(12,2) DEFAULT 0,
  actual_amount DECIMAL(12,2) DEFAULT 0,
  status ENUM('draft', 'confirmed', 'paid', 'closed') DEFAULT 'draft',
  sign_info JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES organizations(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS settlement_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  settlement_id INT NOT NULL,
  order_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  return_amount DECIMAL(12,2) DEFAULT 0,
  FOREIGN KEY (settlement_id) REFERENCES settlements(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS expense_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT NOT NULL,
  expense_type ENUM('nutrition_subsidy', 'self_paid') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  related_id INT,
  related_type VARCHAR(50),
  remark VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_name VARCHAR(100),
  operation_type VARCHAR(50) NOT NULL,
  operation_module VARCHAR(50),
  operation_detail TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO roles (name, description, permissions) VALUES
('system_admin', '系统管理员', '{"supplier_manage": true, "user_manage": true, "order_manage": true, "inventory_manage": true, "finance_manage": true, "report_view": true, "system_settings": true}'),
('township_admin', '乡镇中心校管理员', '{"user_manage": true, "order_manage": true, "inventory_manage": true, "report_view": true}'),
('school_canteen', '学校食堂管理员', '{"order_create": true, "order_edit": true, "inventory_in": true, "inventory_out": true, "inventory_check": true, "return_apply": true}'),
('school_finance', '学校财务人员', '{"settlement_view": true, "settlement_confirm": true, "finance_report": true}'),
('school_leader', '学校领导', '{"report_view": true}'),
('supplier', '供应商', '{"order_view": true, "order_confirm": true, "delivery_create": true, "settlement_view": true, "product_manage": true}');

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('order_deadline', '10:00', '每日订单截止时间'),
('settlement_cycle', 'monthly', '结算周期(monthly/term)'),
('credit_limit', '50000', '信用额度'),
('inventory_cost_method', 'carry_over', '库存成本核算方式(monthly_expense/carry_over)'),
('data_retention_days', '1095', '数据留存天数');