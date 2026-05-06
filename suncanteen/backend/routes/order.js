const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { auth, requirePermission } = require('../middleware/auth');

router.post('/', auth, requirePermission('order_create'), orderController.create);
router.put('/:id/submit', auth, requirePermission('order_edit'), orderController.submit);
router.put('/:id/confirm', auth, requirePermission('order_manage'), orderController.confirm);
router.put('/:id/reject', auth, requirePermission('order_manage'), orderController.reject);
router.get('/', auth, orderController.list);
router.get('/:id', auth, orderController.getById);
router.put('/:id', auth, requirePermission('order_edit'), orderController.update);

module.exports = router;