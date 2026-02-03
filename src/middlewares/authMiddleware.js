const jwt = require('jsonwebtoken');
require('dotenv').config();

const authorize = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(403).json({ error: 'Authorization denied' });
    }

    try {
        // Bearer token syntax might be used, but for simplicity assuming raw token or handle split
        const bearer = token.split(' ');
        const tokenValue = bearer.length === 2 ? bearer[1] : token;

        const verify = jwt.verify(tokenValue, process.env.JWT_SECRET);
        req.user = verify;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

// Middleware to check for specific roles
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Access denied. Requires one of: ${roles.join(', ')}` });
        }
        next();
    };
};

module.exports = { authorize, checkRole };
