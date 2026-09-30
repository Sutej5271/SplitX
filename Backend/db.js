const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }
    })
    : new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
    });

module.exports = pool;