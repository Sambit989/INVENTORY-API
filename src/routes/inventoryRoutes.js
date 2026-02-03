const router = require('express').Router();
const { getInventoryLogs, getProductLogs } = require('../controllers/inventoryController');
const { authorize } = require('../middlewares/authMiddleware');

router.use(authorize);

router.get('/logs', getInventoryLogs);
router.get('/logs/:productId', getProductLogs);

module.exports = router;
