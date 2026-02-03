const { pool } = require('./config/db');
const bcrypt = require('bcrypt');

async function diagnose() {
    try {
        console.log('--- DIAGNOSTIC START ---');

        // 1. List All Users
        console.log('\n1. Listing All Users in Database:');
        const users = await pool.query('SELECT id, name, email, password, role FROM users ORDER BY id ASC');

        if (users.rows.length === 0) {
            console.log('   [WARNING] No users found! The database is empty. You need to run seed.');
            process.exit(0);
        }

        users.rows.forEach(u => {
            console.log(`   - ID: ${u.id} | Name: ${u.name} | Role: ${u.role} | Email: ${u.email}`);
        });

        // 2. Test Login for First User
        const targetUser = users.rows[0];
        console.log(`\n2. Testing Password "password123" for User ID ${targetUser.id} (${targetUser.name})...`);

        const isMatch = await bcrypt.compare('password123', targetUser.password);

        if (isMatch) {
            const fs = require('fs');
            const creds = { user_id: targetUser.id, password: "password123", role: targetUser.role };
            console.log('   [SUCCESS] Password matches! Writing to file...');
            fs.writeFileSync('login_creds.json', JSON.stringify(creds, null, 2));
        } else {
            console.log('   [FAILURE] Password "password123" does NOT match the stored hash.');
            console.log('   [FIX] Please run "node src/seed.js" to reset passwords.');
        }

        console.log('\n--- DIAGNOSTIC END ---');
        process.exit(0);

    } catch (err) {
        console.error('Diagnostic Error:', err);
        process.exit(1);
    }
}

diagnose();
