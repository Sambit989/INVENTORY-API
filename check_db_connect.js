const { pool } = require('./config/db');

async function checkConnection() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('SUCCESS: Database connected successfully at:', res.rows[0].now);
        process.exit(0);
    } catch (err) {
        console.error('FAILURE: Database connection failed:', err.message);
        process.exit(1);
    }
}

checkConnection();
