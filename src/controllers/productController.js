const pool = require('../../config/db');

// Create Product (Admin Only)
const createProduct = async (req, res) => {
    try {
        const { name, sku, price, stock_quantity, reorder_level } = req.body;
        const newProduct = await pool.query(
            'INSERT INTO products (name, sku, price, stock_quantity, reorder_level) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, sku, price, stock_quantity, reorder_level]
        );
        res.json(newProduct.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get All Products (with Pagination and Low Stock Filter)
const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, low_stock } = req.query;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM products';
        let params = [];
        let countQuery = 'SELECT COUNT(*) FROM products';

        if (low_stock === 'true') {
            query += ' WHERE stock_quantity <= reorder_level';
            countQuery += ' WHERE stock_quantity <= reorder_level';
        }

        query += ` ORDER BY id ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const products = await pool.query(query, params);
        const total = await pool.query(countQuery);

        res.json({
            total: parseInt(total.rows[0].count),
            page: parseInt(page),
            products: products.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Single Product
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await pool.query('SELECT * FROM products WHERE id = $1', [id]);

        if (product.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update Product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, sku, price, stock_quantity, reorder_level } = req.body;

        const update = await pool.query(
            'UPDATE products SET name = $1, sku = $2, price = $3, stock_quantity = $4, reorder_level = $5 WHERE id = $6 RETURNING *',
            [name, sku, price, stock_quantity, reorder_level, id]
        );

        if (update.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(update.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete Product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);

        if (deleteOp.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Add Stock (Manual)
const addStock = async (req, res) => {
    const client = await pool.pool.connect();
    try {
        const { id } = req.params;
        const { quantity, reason } = req.body;

        await client.query('BEGIN');

        // Update product
        const update = await client.query(
            'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING *',
            [quantity, id]
        );

        if (update.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        // Log entry
        await client.query(
            'INSERT INTO stock_logs (product_id, change_type, quantity, reason) VALUES ($1, $2, $3, $4)',
            [id, 'IN', quantity, reason || 'Manual Addition']
        );

        await client.query('COMMIT');
        res.json(update.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

// Reduce Stock (Manual)
const reduceStock = async (req, res) => {
    const client = await pool.pool.connect();
    try {
        const { id } = req.params;
        const { quantity, reason } = req.body;

        await client.query('BEGIN');

        // Check stock first
        const product = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [id]);
        if (product.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.rows[0].stock_quantity < quantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Update
        const update = await client.query(
            'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 RETURNING *',
            [quantity, id]
        );

        // Log
        await client.query(
            'INSERT INTO stock_logs (product_id, change_type, quantity, reason) VALUES ($1, $2, $3, $4)',
            [id, 'OUT', quantity, reason || 'Manual Reduction']
        );

        await client.query('COMMIT');
        res.json(update.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

// Get Low Stock Products
const getLowStock = async (req, res) => {
    try {
        const products = await pool.query('SELECT * FROM products WHERE stock_quantity <= reorder_level');
        res.json(products.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    addStock,
    reduceStock,
    getLowStock
};
