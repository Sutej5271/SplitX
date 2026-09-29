require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("./db");

async function fixPasswords() {
    try {
        const result = await pool.query(
            "SELECT id, password FROM users"
        );

        for (const user of result.rows) {

            // Skip passwords that are already bcrypt hashes
            if (
                user.password.startsWith("$2a$") ||
                user.password.startsWith("$2b$") ||
                user.password.startsWith("$2y$")
            ) {
                console.log(`User ${user.id}: already hashed`);
                continue;
            }

            // Hash plain-text password
            const hashedPassword = await bcrypt.hash(
                user.password,
                10
            );

            await pool.query(
                "UPDATE users SET password = $1 WHERE id = $2",
                [hashedPassword, user.id]
            );

            console.log(`User ${user.id}: password hashed successfully`);
        }

        console.log("All passwords checked successfully.");

    } catch (error) {
        console.error("Error fixing passwords:", error);
    } finally {
        await pool.end();
    }
}

fixPasswords();