const express = require('express');
const router = express.Router();
const settlementController = require('../controllers/settlementController');
const { auth, requirePermission } = require('../middleware/auth');

router.post('/monthly', auth, requirePermission('finance_manage'), settlementController.createMonthly);
router.put('/:id/confirm', auth, requirePermission('settlement_confirm'), settlementController.confirm);
router.get('/', auth, settlementController.list);
router.get('/:id', auth, settlementController.getById);

module.exports = router;