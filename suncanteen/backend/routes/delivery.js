const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { auth, requirePermission } = require('../middleware/auth');

router.post('/', auth, requirePermission('delivery_create'), deliveryController.create);
router.get('/', auth, deliveryController.list);
router.get('/:id', auth, deliveryController.getById);
router.put('/:id/sign', auth, deliveryController.sign);

module.exports = router;