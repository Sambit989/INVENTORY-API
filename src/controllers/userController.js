const pool = require('../../config/db');
const bcrypt = require('bcrypt');

// Create User (Admin Only - for creating other staff)
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, is_active, created_at',
            [name, email, bcryptPassword, role || 'staff']
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get All Users
const getUsers = async (req, res) => {
    try {
        const users = await pool.query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY id ASC');
        res.json(users.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Single User
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await pool.query('SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1', [id]);

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update User
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, is_active } = req.body;

        const user = await pool.query(
            'UPDATE users SET name = $1, email = $2, role = $3, is_active = $4 WHERE id = $5 RETURNING id, name, email, role, is_active',
            [name, email, role, is_active, id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Disable User (Soft Delete)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Don't actually delete, just set is_active = false
        const user = await pool.query(
            'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, is_active',
            [id]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User disabled successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};
