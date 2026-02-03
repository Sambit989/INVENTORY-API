const { pool } = require('./config/db');

pool.query('SELECT id, role FROM users ORDER BY id ASC LIMIT 1')
    .then(res => {
        console.log('USER_ID:' + res.rows[0].id);
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
