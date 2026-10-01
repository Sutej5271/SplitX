const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Invalid authorization format"
        });
    }

    const secret = process.env.JWT_SECRET || "splitx_super_secret_key_change_this";

    jwt.verify(token, secret, (error, user) => {
        if (error) {
            return res.status(403).json({
                message: "Invalid or expired token"
            });
        }

        // Normalize the logged-in user's ID
        req.user = {
            ...user,
            id: user.id || user.userId
        };

        next();
    });
}

module.exports = authenticateToken;