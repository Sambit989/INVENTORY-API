const pool = require('../../config/db');

// Get All Settings
const getSettings = async (req, res) => {
    try {
        const settings = await pool.query('SELECT * FROM settings');
        const formatted = {};
        settings.rows.forEach(s => formatted[s.key] = s.value);
        res.json(formatted);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update Setting
const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const update = await pool.query(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2 RETURNING *',
            [key, value]
        );

        res.json(update.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getSettings,
    updateSetting
};
