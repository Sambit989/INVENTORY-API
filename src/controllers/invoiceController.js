const pool = require('../../config/db');
const PDFDocument = require('pdfkit');

// Get All Invoices (Basically completed orders)
const getInvoices = async (req, res) => {
    try {
        const invoices = await pool.query(
            'SELECT id as invoice_id, customer_name, total_amount, created_at as date FROM orders WHERE status = $1 ORDER BY created_at DESC',
            ['completed'] // Only show completed orders as invoices usually
        );
        res.json(invoices.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Invoice by Order ID
const getInvoiceByOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        const items = await pool.query(
            'SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE order_id = $1',
            [orderId]
        );

        res.json({
            invoice_no: `INV-${order.rows[0].id}`,
            date: order.rows[0].created_at,
            customer: order.rows[0].customer_name,
            items: items.rows,
            total: order.rows[0].total_amount
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Generate PDF
const generateInvoicePDF = async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

        const order = orderRes.rows[0];
        const itemsRes = await pool.query(
            'SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE order_id = $1',
            [orderId]
        );
        const items = itemsRes.rows;

        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(25).text('INVOICE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice Number: INV-${order.id}`);
        doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`);
        doc.text(`Customer: ${order.customer_name}`);
        doc.moveDown();

        // Table Header
        doc.text('Item', 100, 250);
        doc.text('Qty', 300, 250);
        doc.text('Price', 370, 250);
        doc.text('Total', 450, 250);

        doc.moveTo(100, 265).lineTo(500, 265).stroke();

        let y = 280;
        items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            doc.text(item.name, 100, y);
            doc.text(item.quantity.toString(), 300, y);
            doc.text(`$${item.price}`, 370, y);
            doc.text(`$${itemTotal.toFixed(2)}`, 450, y);
            y += 20;
        });

        doc.moveTo(100, y + 10).lineTo(500, y + 10).stroke();
        doc.fontSize(14).text(`Total Amount: $${order.total_amount}`, 350, y + 30);

        doc.end();

    } catch (err) {
        console.error(err.message);
        // If headers already sent, we can't really error out nicely to client in streaming response, but we try
        if (!res.headersSent) res.status(500).send('Server Error');
    }
};

module.exports = {
    getInvoices,
    getInvoiceByOrder,
    generateInvoicePDF
};
