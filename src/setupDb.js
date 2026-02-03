const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const setupDatabase = async () => {
    try {
        const schemaPath = path.join(__dirname, 'models', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running database migrations...');
        await pool.query(schemaSql);
        console.log('Database tables created successfully.');

        process.exit(0);
    } catch (err) {
        console.error('Error setting up database:', err);
        process.exit(1);
    }
};

setupDatabase();
