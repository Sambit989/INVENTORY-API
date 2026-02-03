const router = require('express').Router();
const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
} = require('../controllers/orderController');
const { authorize, checkRole } = require('../middlewares/authMiddleware');

// Staff/Admin can view and create orders
router.post('/', authorize, createOrder);
router.get('/', authorize, getOrders);
router.get('/:id', authorize, getOrderById);

// Update Status (Staff/Admin)
router.put('/:id/status', authorize, updateOrderStatus);

module.exports = router;
