const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { auth, requirePermission } = require('../middleware/auth');

router.get('/settings', auth, requirePermission('system_settings'), systemController.getSettings);
router.put('/settings', auth, requirePermission('system_settings'), systemController.updateSettings);
router.get('/logs', auth, requirePermission('system_settings'), systemController.getLogs);

module.exports = router;