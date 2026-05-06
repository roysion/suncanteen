const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { auth, requirePermission } = require('../middleware/auth');

router.get('/', auth, inventoryController.list);
router.get('/:id', auth, inventoryController.getById);
router.post('/out', auth, requirePermission('inventory_out'), inventoryController.createOut);
router.post('/check', auth, requirePermission('inventory_check'), inventoryController.check);
router.get('/records/out', auth, inventoryController.listOut);

module.exports = router;