const pool = require('../../config/db');

// Get All Inventory Logs
const getInventoryLogs = async (req, res) => {
    try {
        const logs = await pool.query(
            'SELECT sl.*, p.name as product_name FROM stock_logs sl JOIN products p ON sl.product_id = p.id ORDER BY sl.timestamp DESC'
        );
        res.json(logs.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Logs by Product
const getProductLogs = async (req, res) => {
    try {
        const { productId } = req.params;
        const logs = await pool.query(
            'SELECT * FROM stock_logs WHERE product_id = $1 ORDER BY timestamp DESC',
            [productId]
        );
        res.json(logs.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getInventoryLogs,
    getProductLogs
};
