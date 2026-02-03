const pool = require('../../config/db');

// Create Order (The Core Logic)
const createOrder = async (req, res) => {
    const client = await pool.pool.connect();
    try {
        const { customer_name, items } = req.body;
        // items: [{ product_id, quantity }]

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items in order' });
        }

        await client.query('BEGIN');

        let totalAmount = 0;
        const processedItems = [];

        // 1. Process each item
        for (const item of items) {
            const { product_id, quantity } = item;

            // Check stock and lock row
            const productRes = await client.query(
                'SELECT * FROM products WHERE id = $1 FOR UPDATE',
                [product_id]
            );

            if (productRes.rows.length === 0) {
                throw new Error(`Product ID ${product_id} not found`);
            }

            const product = productRes.rows[0];

            if (product.stock_quantity < quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }

            // Deduct stock
            await client.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [quantity, product_id]
            );

            // Log stock movement
            await client.query(
                'INSERT INTO stock_logs (product_id, change_type, quantity, reason) VALUES ($1, $2, $3, $4)',
                [product_id, 'OUT', quantity, 'Order Placement']
            );

            const itemTotal = parseFloat(product.price) * quantity;
            totalAmount += itemTotal;

            processedItems.push({
                product_id,
                quantity,
                price: product.price,
                itemTotal
            });
        }

        // 2. Calculate Final Bill (Example: 10% Tax)
        const taxRate = 0.10;
        const taxAmount = totalAmount * taxRate;
        const finalAmount = totalAmount + taxAmount;

        // 3. Create Order
        const orderRes = await client.query(
            'INSERT INTO orders (customer_name, total_amount, status) VALUES ($1, $2, $3) RETURNING id, created_at',
            [customer_name, finalAmount, 'pending']
        );
        const orderId = orderRes.rows[0].id;

        // 4. Create Order Items
        for (const item of processedItems) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Order placed successfully',
            order: {
                id: orderId,
                customer_name,
                items: processedItems,
                subtotal: totalAmount,
                tax: taxAmount,
                total: finalAmount,
                status: 'pending',
                created_at: orderRes.rows[0].created_at
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

// Get All Orders
const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const orders = await pool.query(
            'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        const total = await pool.query('SELECT COUNT(*) FROM orders');

        res.json({
            total: parseInt(total.rows[0].count),
            page: parseInt(page),
            orders: orders.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Single Order
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);

        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const items = await pool.query(
            'SELECT oi.id, p.name, oi.quantity, oi.price FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
            [id]
        );

        res.json({
            ...order.rows[0],
            items: items.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // pending, completed, cancelled

        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Logic handled: if cancelled, we might want to restock. (Optional complexity)
        // For now, keep it simple or impl restock on cancel.

        // Let's implement Restock on Cancel
        if (status === 'cancelled') {
            // Fetch items and restore stock
            const items = await pool.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id]);
            for (const item of items.rows) {
                await pool.query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.product_id]);
                await pool.query('INSERT INTO stock_logs (product_id, change_type, quantity, reason) VALUES ($1, $2, $3, $4)', [item.product_id, 'IN', item.quantity, 'Order Cancelled']);
            }
        }

        const updatedOrder = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );

        if (updatedOrder.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(updatedOrder.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
};
