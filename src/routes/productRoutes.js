const router = require('express').Router();
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    addStock,
    reduceStock,
    getLowStock
} = require('../controllers/productController');
const { authorize, checkRole } = require('../middlewares/authMiddleware');

// Public or Staff/Admin
router.get('/', authorize, getProducts);
router.get('/low-stock', authorize, getLowStock); // Specific route before :id
router.get('/:id', authorize, getProductById);

// Stock Management
router.put('/:id/stock/add', authorize, addStock);
router.put('/:id/stock/reduce', authorize, reduceStock);

// Admin Only
router.post('/', authorize, checkRole(['admin']), createProduct);
router.put('/:id', authorize, checkRole(['admin']), updateProduct);
router.delete('/:id', authorize, checkRole(['admin']), deleteProduct);

module.exports = router;
