const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

const pool = connectionString
    ? new Pool({
        connectionString,
        ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }
    })
    : new Pool({
        user: process.env.DB_USER || "postgres",
        host: process.env.DB_HOST || "localhost",
        database: process.env.DB_NAME || "SplitX",
        password: process.env.DB_PASSWORD || "July@052007",
        port: process.env.DB_PORT || 5432,
        ssl: isProduction || process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
    });

module.exports = pool;