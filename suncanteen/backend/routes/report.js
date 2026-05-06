const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth, requirePermission } = require('../middleware/auth');

router.get('/purchase', auth, requirePermission('report_view'), reportController.purchaseAnalysis);
router.get('/inventory', auth, requirePermission('report_view'), reportController.inventoryAnalysis);
router.get('/dashboard', auth, requirePermission('report_view'), reportController.dashboard);

module.exports = router;