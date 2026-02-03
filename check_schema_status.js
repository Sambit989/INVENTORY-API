const { pool } = require('./config/db');

async function checkColumns() {
    try {
        console.log('--- Checking Database Schema ---');

        // Check for settings table
        const settings = await pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'settings'");
        console.log(`Table 'settings' exists: ${settings.rows.length > 0}`);

        // Check for is_active in users
        const userCols = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active'"
        );
        console.log(`Column 'is_active' in 'users' exists: ${userCols.rows.length > 0}`);

        if (userCols.rows.length > 0) {
            // Check a sample user
            const user = await pool.query('SELECT name, is_active FROM users LIMIT 1');
            console.log('Sample User:', user.rows[0]);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkColumns();
