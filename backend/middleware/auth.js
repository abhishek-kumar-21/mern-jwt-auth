const jwt = require('jsonwebtoken');

/**
 * Middleware — verifies the Bearer JWT on protected routes.
 * Attaches decoded payload to req.user on success.
 */
module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(401).send('Access denied. No token provided.');

    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
        next();
    } catch (err) {
        // Distinguish expired vs tampered
        if (err.name === 'TokenExpiredError')
            return res.status(401).send('Session expired. Please login again.');
        return res.status(401).send('Invalid token.');
    }
};
