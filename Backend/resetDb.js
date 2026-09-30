require("dotenv").config();
const pool = require("./db");

async function resetDatabase() {
    try {
        console.log("Connecting to database...");

        // Fetch all existing user table names in the public schema dynamically
        const tablesResult = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE';
        `);

        const tables = tablesResult.rows.map((r) => r.table_name);
        console.log("Found tables:", tables);

        if (tables.length > 0) {
            const truncateQuery = `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(", ")} RESTART IDENTITY CASCADE;`;
            await pool.query(truncateQuery);
            console.log("Successfully truncated all tables and reset ID sequences.");
        } else {
            console.log("No tables found to truncate.");
        }

    } catch (error) {
        console.error("Error resetting database:", error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

resetDatabase();
