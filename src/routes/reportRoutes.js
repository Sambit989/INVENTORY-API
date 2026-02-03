const router = require('express').Router();
const { getSalesReport, getInventoryReport, getMonthlySales, getProfitReport } = require('../controllers/reportController');
const { authorize, checkRole } = require('../middlewares/authMiddleware');

router.use(authorize);
router.use(checkRole(['admin']));

// Sales Reports
router.get('/sales/daily', getSalesReport); // Uses query params for custom dates too
router.get('/sales/monthly', getMonthlySales);
router.get('/sales/custom', getSalesReport); // Alias

// Inventory Reports
router.get('/inventory/summary', getInventoryReport);
router.get('/inventory/low-stock', getInventoryReport); // The summary report includes low stock count

// Profit
router.get('/profit', getProfitReport);

module.exports = router;
