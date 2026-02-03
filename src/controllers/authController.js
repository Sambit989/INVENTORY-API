const pool = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Please provide name, email, and password' });
        }

        // 1. Check if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(401).json({ error: 'User already exists' });
        }

        // 2. Hash password
        const saltRound = 10;
        const salt = await bcrypt.genSalt(saltRound);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // 3. Insert user (default role is staff if not provided)
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, bcryptPassword, role || 'staff']
        );

        // 4. Generate Token
        const token = jwt.sign({ user_id: newUser.rows[0].id, role: newUser.rows[0].role }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        res.json({ token, user: newUser.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const login = async (req, res) => {
    try {
        console.log('Login Request Body:', req.body);
        const { user_id, password } = req.body || {};

        if (!user_id || !password) {
            return res.status(400).json({ error: 'Please provide user_id and password' });
        }

        // 1. Check if user exists by ID
        // Note: user_id should be an integer/number for SQL if ID is serial, but param queries handle string-to-int usually. 
        // We'll wrap in try-catch for SQL syntax errors if non-int passed to integer column? 
        // Actually pg driver handles it or throws. Let's rely on simple query.
        const user = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);

        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid Credential (User not found)' });
        }

        // 2. Check password
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid Credential (Password mismatch)' });
        }

        // 3. Generate Token
        const token = jwt.sign({ user_id: user.rows[0].id, role: user.rows[0].role }, process.env.JWT_SECRET, {
            expiresIn: '1h'
        });

        res.json({ token, user: { id: user.rows[0].id, name: user.rows[0].name, email: user.rows[0].email, role: user.rows[0].role } });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
};

const getMe = async (req, res) => {
    try {
        // req.user is set by middleware
        const user = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.user_id]);
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const logout = async (req, res) => {
    // JWT is stateless, so "logout" is usually client-side (delete token).
    // But we can return a success message or blacklist token if we implemented Redis.
    res.json({ message: 'Logged out successfully' });
};

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.user_id;

        const user = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (user.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const validPassword = await bcrypt.compare(oldPassword, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid old password' });
        }

        const salt = await bcrypt.genSalt(10);
        const bcryptPassword = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [bcryptPassword, userId]);
        res.json({ message: 'Password updated successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    register,
    login,
    getMe,
    logout,
    changePassword
};
