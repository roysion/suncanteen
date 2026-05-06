const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, requirePermission } = require('../middleware/auth');

router.post('/', auth, requirePermission('product_manage'), productController.create);
router.get('/', auth, productController.list);
router.get('/:id', auth, productController.getById);
router.put('/:id', auth, requirePermission('product_manage'), productController.update);
router.delete('/:id', auth, requirePermission('product_manage'), productController.remove);
router.get('/categories', auth, productController.listCategories);
router.post('/categories', auth, requirePermission('product_manage'), productController.createCategory);

module.exports = router;