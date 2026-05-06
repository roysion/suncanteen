const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth, requirePermission } = require('../middleware/auth');

router.get('/purchase', auth, requirePermission('report_view'), reportController.purchaseAnalysis);
router.get('/purchase/detail', auth, requirePermission('report_view'), reportController.purchaseDetail);
router.get('/purchase/export', auth, requirePermission('report_export'), reportController.exportPurchase);
router.get('/inventory', auth, requirePermission('report_view'), reportController.inventoryAnalysis);
router.get('/inventory/detail', auth, requirePermission('report_view'), reportController.inventoryDetail);
router.get('/inventory/export', auth, requirePermission('report_export'), reportController.exportInventory);
router.get('/dashboard', auth, requirePermission('report_view'), reportController.dashboard);
router.get('/suppliers', auth, requirePermission('report_view'), reportController.getSuppliers);
router.get('/warehouses', auth, requirePermission('report_view'), reportController.getWarehouses);

module.exports = router;