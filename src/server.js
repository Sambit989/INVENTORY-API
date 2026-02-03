const app = require('./app');
const { pool } = require('../config/db');

const PORT = process.env.PORT || 5000;

// Check DB connection before starting
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
});
