const { pool } = require('../../config/db');
const bcrypt = require('bcrypt');

const resetData = async (req, res) => {
    try {
        await pool.query('DELETE FROM order_items');
        await pool.query('DELETE FROM orders');
        await pool.query('DELETE FROM stock_logs');
        await pool.query('DELETE FROM products');
        await pool.query('DELETE FROM users');
        res.json({ message: 'Database cleared successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error clearing database');
    }
};

const seedData = async (req, res) => {
    const client = await pool.pool.connect();
    try {
        await client.query('BEGIN');

        // Clear first
        await client.query('DELETE FROM order_items');
        await client.query('DELETE FROM orders');
        await client.query('DELETE FROM stock_logs');
        await client.query('DELETE FROM products');
        await client.query('DELETE FROM users');

        // Users
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);
        await client.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', ['Admin User', 'admin@example.com', password, 'admin']);
        await client.query('INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)', ['Staff User', 'staff@example.com', password, 'staff']);

        // Products
        const demoProducts = [
            { name: 'Gaming Laptop', sku: 'LAP-001', price: 1200.00, stock: 15 },
            { name: 'Wireless Mouse', sku: 'ACC-002', price: 25.50, stock: 50 },
            { name: 'Mechanical Keyboard', sku: 'ACC-003', price: 85.00, stock: 30 },
            { name: 'Smartphone 15 Pro', sku: 'PHN-005', price: 999.00, stock: 25 },
        ];

        for (const p of demoProducts) {
            await client.query(
                'INSERT INTO products (name, sku, price, stock_quantity) VALUES ($1, $2, $3, $4)',
                [p.name, p.sku, p.price, p.stock]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Database seeded with demo data' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).send('Error seeding database');
    } finally {
        client.release();
    }
};

module.exports = {
    resetData,
    seedData
};
