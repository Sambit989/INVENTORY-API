const pool = require('../../config/db');

// Sales Report (Revenue over time)
const getSalesReport = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let query = `
            SELECT 
                DATE(created_at) as date, 
                COUNT(id) as total_orders, 
                SUM(total_amount) as total_revenue 
            FROM orders 
            WHERE status != 'cancelled'
        `;
        let params = [];

        if (start_date && end_date) {
            query += ` AND created_at BETWEEN $1 AND $2`;
            params.push(start_date, end_date);
        }

        query += ` GROUP BY DATE(created_at) ORDER BY date DESC`;

        const report = await pool.query(query, params);

        // Calculate grand total
        const grandTotal = report.rows.reduce((acc, row) => acc + parseFloat(row.total_revenue), 0);

        res.json({
            summary: {
                total_revenue: grandTotal,
                count: report.rows.length
            },
            daily_sales: report.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Inventory Report (Stock Value & Low Stock)
const getInventoryReport = async (req, res) => {
    try {
        // Total Inventory Value
        const valueQuery = await pool.query('SELECT SUM(price * stock_quantity) as total_inventory_value FROM products');

        // Low Stock Count
        const lowStockQuery = await pool.query('SELECT COUNT(*) as low_stock_count FROM products WHERE stock_quantity <= reorder_level');

        // Top Selling Products (based on order_items)
        const topSellingQuery = await pool.query(`
            SELECT p.name, SUM(oi.quantity) as total_sold
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            GROUP BY p.name
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        res.json({
            inventory_value: parseFloat(valueQuery.rows[0].total_inventory_value || 0),
            low_stock_items: parseInt(lowStockQuery.rows[0].low_stock_count),
            top_selling_products: topSellingQuery.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Monthly Sales Report
const getMonthlySales = async (req, res) => {
    try {
        const report = await pool.query(`
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month, 
                COUNT(id) as total_orders, 
                SUM(total_amount) as total_revenue 
            FROM orders 
            WHERE status != 'cancelled'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM') 
            ORDER BY month DESC
        `);
        res.json(report.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Profit Report (Estimated)
const getProfitReport = async (req, res) => {
    try {
        // Since we don't have Cost Price, we'll assume a flat 30% profit margin for demo
        const revenue = await pool.query("SELECT SUM(total_amount) as total FROM orders WHERE status != 'cancelled'");
        const totalRevenue = parseFloat(revenue.rows[0].total || 0);
        const estimatedProfit = totalRevenue * 0.30;

        res.json({
            total_revenue: totalRevenue,
            estimated_profit: estimatedProfit,
            note: "Profit calculated based on fixed 30% margin (Cost Price not tracked individually)"
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getSalesReport,
    getInventoryReport,
    getMonthlySales,
    getProfitReport
};
