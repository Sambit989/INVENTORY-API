const { pool } = require('./config/db');

async function checkSchema() {
    try {
        const res = await pool.query(
            "SELECT table_schema FROM information_schema.tables WHERE table_name = 'products'"
        );
        if (res.rows.length > 0) {
            console.log(`Table 'products' is in schema: '${res.rows[0].table_schema}'`);
        } else {
            console.log("Table 'products' NOT FOUND.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
