const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, requirePermission } = require('../middleware/auth');

router.post('/', auth, requirePermission('user_manage'), userController.create);
router.get('/', auth, userController.list);
router.get('/:id', auth, userController.getById);
router.put('/:id', auth, requirePermission('user_manage'), userController.update);
router.put('/:id/password', auth, requirePermission('user_manage'), userController.updatePassword);
router.delete('/:id', auth, requirePermission('user_manage'), userController.remove);
router.get('/roles', auth, userController.listRoles);

module.exports = router;