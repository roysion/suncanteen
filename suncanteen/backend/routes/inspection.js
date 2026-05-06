const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const { auth, requirePermission } = require('../middleware/auth');

router.post('/', auth, requirePermission('inventory_in'), inspectionController.create);
router.get('/', auth, inspectionController.list);
router.get('/:id', auth, inspectionController.getById);

module.exports = router;