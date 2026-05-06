const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const supplierRoutes = require('./routes/supplier');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const deliveryRoutes = require('./routes/delivery');
const inspectionRoutes = require('./routes/inspection');
const inventoryRoutes = require('./routes/inventory');
const returnRoutes = require('./routes/return');
const settlementRoutes = require('./routes/settlement');
const userRoutes = require('./routes/user');
const organizationRoutes = require('./routes/organization');
const reportRoutes = require('./routes/report');
const systemRoutes = require('./routes/system');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system', systemRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found', code: 404 });
});

app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(500).json({ success: false, message: 'Internal server error', code: 500 });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;