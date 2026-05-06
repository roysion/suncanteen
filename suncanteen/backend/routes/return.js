const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { auth, requirePermission } = require('../middleware/auth');

router.post('/', auth, requirePermission('return_apply'), returnController.create);
router.put('/:id/approve', auth, requirePermission('order_manage'), returnController.approve);
router.put('/:id/reject', auth, requirePermission('order_manage'), returnController.reject);
router.put('/:id/complete', auth, returnController.complete);
router.get('/', auth, returnController.list);
router.get('/:id', auth, returnController.getById);

module.exports = router;