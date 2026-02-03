const router = require('express').Router();
const { getInvoices, getInvoiceByOrder, generateInvoicePDF } = require('../controllers/invoiceController');
const { authorize } = require('../middlewares/authMiddleware');

router.use(authorize);

router.get('/', getInvoices);
router.get('/:orderId', getInvoiceByOrder);
router.post('/:orderId/pdf', generateInvoicePDF); // Using POST or GET is fine, usually GET for download but POST requested

module.exports = router;
