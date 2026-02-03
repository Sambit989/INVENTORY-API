const { pool } = require('./config/db');

async function listUsers() {
    try {
        const res = await pool.query('SELECT id, email, role FROM users');
        console.log('Users found:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error('Error fetching users:', err);
        process.exit(1);
    }
}

listUsers();
