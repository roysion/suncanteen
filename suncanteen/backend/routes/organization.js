const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const { auth, requirePermission } = require('../middleware/auth');

router.post('/', auth, requirePermission('user_manage'), organizationController.create);
router.get('/', auth, organizationController.list);
router.get('/:id', auth, organizationController.getById);
router.put('/:id', auth, requirePermission('user_manage'), organizationController.update);
router.delete('/:id', auth, requirePermission('user_manage'), organizationController.remove);

module.exports = router;