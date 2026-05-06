const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { auth, requirePermission } = require('../middleware/auth');

router.post('/register', supplierController.register);
router.get('/', auth, supplierController.list);
router.get('/:id', auth, supplierController.getById);
router.put('/:id/approve', auth, requirePermission('supplier_manage'), supplierController.approve);
router.put('/:id/reject', auth, requirePermission('supplier_manage'), supplierController.reject);
router.put('/:id/status', auth, requirePermission('supplier_manage'), supplierController.updateStatus);
router.put('/:id', auth, supplierController.update);
router.delete('/:id', auth, requirePermission('supplier_manage'), supplierController.remove);

module.exports = router;