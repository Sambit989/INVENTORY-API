const { faker } = require('@faker-js/faker');
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

const seedData = async () => {
    try {
        console.log('Seeding Data...');

        // 1. Create Users
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);

        await pool.query('DELETE FROM order_items');
        await pool.query('DELETE FROM orders');
        await pool.query('DELETE FROM stock_logs');
        await pool.query('DELETE FROM products');
        await pool.query('DELETE FROM users');

        // Users (Password reused)


        const adminUser = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, role',
            ['Admin User', 'admin@example.com', password, 'admin']
        );

        const staffUser = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, role',
            ['Staff User', 'staff@example.com', password, 'staff']
        );

        console.log('--- Users Created ---');
        console.log(`Admin ID: ${adminUser.rows[0].id} (Login with this ID)`);
        console.log(`Staff ID: ${staffUser.rows[0].id} (Login with this ID)`);

        // 2. Create Products (Simple Demo Data)
        const demoProducts = [
            { name: 'Gaming Laptop', sku: 'LAP-001', price: 1200.00, stock: 15 },
            { name: 'Wireless Mouse', sku: 'ACC-002', price: 25.50, stock: 50 },
            { name: 'Mechanical Keyboard', sku: 'ACC-003', price: 85.00, stock: 30 },
            { name: '27-inch 4K Monitor', sku: 'MON-004', price: 350.00, stock: 20 },
            { name: 'Smartphone 15 Pro', sku: 'PHN-005', price: 999.00, stock: 25 },
            { name: 'Noise Cancelling Headphones', sku: 'AUD-006', price: 199.99, stock: 40 },
            { name: 'USB-C Docking Station', sku: 'ACC-007', price: 120.00, stock: 35 },
            { name: 'Ergonomic Office Chair', sku: 'FUR-008', price: 250.00, stock: 10 },
            { name: 'Standing Desk', sku: 'FUR-009', price: 450.00, stock: 5 },
            { name: 'Webcam 1080p', sku: 'ACC-010', price: 60.00, stock: 45 }
        ];

        const products = [];
        for (const p of demoProducts) {
            const res = await pool.query(
                'INSERT INTO products (name, sku, price, stock_quantity) VALUES ($1, $2, $3, $4) RETURNING id',
                [p.name, p.sku, p.price, p.stock]
            );
            products.push(res.rows[0].id);
        }
        console.log('Products seeded (Demo Data)');

        // 3. Create Orders (50)
        for (let i = 0; i < 50; i++) {
            const customer = faker.person.fullName();
            const total = faker.commerce.price({ min: 50, max: 2000 });

            const orderRes = await pool.query(
                'INSERT INTO orders (customer_name, total_amount, status, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
                [customer, total, 'completed', faker.date.past()]
            );

            // Create Order Items
            const itemsCount = faker.number.int({ min: 1, max: 5 });
            for (let j = 0; j < itemsCount; j++) {
                const productId = products[Math.floor(Math.random() * products.length)];
                await pool.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                    [orderRes.rows[0].id, productId, faker.number.int({ min: 1, max: 5 }), faker.commerce.price({ min: 10, max: 500 })]
                );
            }
        }
        console.log('Orders seeded');

        console.log('Seeding Complete');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
