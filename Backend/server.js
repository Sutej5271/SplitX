require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

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

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.status(403).json({
                message: "Invalid or expired token"
            });
        }

        req.user = user;

        next();
    });
}

async function testDatabase() {
    try {
        const result = await pool.query("SELECT 1");
        console.log("Database connected:", result.rows);
    } catch (error) {
        console.error("Database connection error:", error);
    }
}

testDatabase();

app.get("/expenses", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM expenses"
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.get("/groups/:groupId/expenses", async (req, res) => {
    try {
        const groupId = Number(req.params.groupId);

        const result = await pool.query(
            "SELECT * FROM expenses WHERE group_id = $1 ORDER BY id",
            [groupId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.post("/expenses", authenticateToken, async (req, res) => {
    try {
        const {
            group_id,
            description,
            amount,
            date
        } = req.body;

        const userId = req.user.userId;

        const memberCheck = await pool.query(
            `SELECT *
             FROM group_members
             WHERE group_id = $1
             AND user_id = $2`,
            [group_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }
        const result = await pool.query(
            `INSERT INTO expenses
             (group_id, paid_by, description, amount, date)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [group_id, userId, description, amount, date]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.post("/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users
            (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, created_at`,
            [name, email, hashedPassword]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.get("/expenses/:id", authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);

        const result = await pool.query(
            "SELECT * FROM expenses WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.put("/expenses/:id", authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
            group_id,
            description,
            amount,
            date
        } = req.body;

        const paid_by = req.user.userId;

        const memberCheck = await pool.query(
            `SELECT *
             FROM group_members
             WHERE group_id = $1
             AND user_id = $2`,
            [group_id, req.user.userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        const result = await pool.query(
            `UPDATE expenses
             SET
                group_id = $1,
                paid_by = $2,
                description = $3,
                amount = $4,
                date = $5
             WHERE id = $6
             RETURNING *`,
            [
                group_id,
                paid_by,
                description,
                amount,
                date,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.patch("/expenses/:id", authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
            group_id,
            description,
            amount,
            date
        } = req.body;

        const paid_by = req.user.userId;

        const memberCheck = await pool.query(
            `SELECT *
             FROM group_members
             WHERE group_id = $1
             AND user_id = $2`,
            [group_id, req.user.userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        const existing = await pool.query(
            "SELECT * FROM expenses WHERE id = $1",
            [id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        const oldExpense = existing.rows[0];

        const updatedGroupId =
            group_id !== undefined
                ? group_id
                : oldExpense.group_id;

        const updatedPaidBy =
            paid_by !== undefined
                ? paid_by
                : oldExpense.paid_by;

        const updatedDescription =
            description !== undefined
                ? description
                : oldExpense.description;

        const updatedAmount =
            amount !== undefined
                ? amount
                : oldExpense.amount;

        const updatedDate =
            date !== undefined
                ? date
                : oldExpense.date;

        const result = await pool.query(
            `UPDATE expenses
             SET
                group_id = $1,
                paid_by = $2,
                description = $3,
                amount = $4,
                date = $5
             WHERE id = $6
             RETURNING *`,
            [
                updatedGroupId,
                updatedPaidBy,
                updatedDescription,
                updatedAmount,
                updatedDate,
                id
            ]
        );

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.delete("/expenses/:id", authenticateToken, async (req, res) => {
    try {
        const id = Number(req.params.id);

        const result = await pool.query(
            `DELETE FROM expenses
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json({
            message: "Expense deleted",
            expense: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.post("/expenses/:id/split", authenticateToken, async (req, res) => {
    try {
        const expenseId = Number(req.params.id);
        const { user_ids } = req.body;

        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({
                message: "user_ids must be a non-empty array"
            });
        }

        const expenseResult = await pool.query(
            "SELECT * FROM expenses WHERE id = $1",
            [expenseId]
        );

        if (expenseResult.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        const expense = expenseResult.rows[0];

        const membersResult = await pool.query(
            `SELECT user_id
             FROM group_members
             WHERE group_id = $1
             AND user_id = ANY($2::int[])`,
            [expense.group_id, user_ids]
        );

        if (membersResult.rows.length !== user_ids.length) {
            return res.status(400).json({
                message: "All users must be members of the group"
            });
        }

        const share = Number(expense.amount) / user_ids.length;

        for (const userId of user_ids) {
            await pool.query(
                `INSERT INTO expense_splits
                 (expense_id, user_id, amount)
                 VALUES ($1, $2, $3)`,
                [expenseId, userId, share]
            );
        }

        res.status(201).json({
            message: "Expense split successfully",
            expense_id: expenseId,
            total_amount: expense.amount,
            users: user_ids,
            amount_per_user: share
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/expenses/:id/split", authenticateToken, async (req, res) => {
    try {
        const expenseId = Number(req.params.id);

        const result = await pool.query(
            `SELECT 
                es.id,
                es.expense_id,
                es.user_id,
                u.name,
                u.email,
                es.amount
             FROM expense_splits es
             JOIN users u ON es.user_id = u.id
             WHERE es.expense_id = $1
             ORDER BY es.user_id`,
            [expenseId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "No split found for this expense"
            });
        }

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/groups/:groupId/balances", authenticateToken, async (req, res) => {
    try {
        const groupId = Number(req.params.groupId);

        const result = await pool.query(
            `SELECT 
                u.id,
                u.name,
                COALESCE(SUM(
                    CASE
                        WHEN e.paid_by = u.id THEN e.amount
                        ELSE 0
                    END
                ), 0)
                -
                COALESCE(SUM(es.amount), 0) AS balance
             FROM users u
             JOIN group_members gm ON gm.user_id = u.id
             LEFT JOIN expenses e ON e.group_id = gm.group_id
             LEFT JOIN expense_splits es
                ON es.expense_id = e.id
                AND es.user_id = u.id
             WHERE gm.group_id = $1
             GROUP BY u.id, u.name
             ORDER BY u.id`,
            [groupId]
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/groups", authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Group name is required"
            });
        }

        const groupResult = await pool.query(
            `INSERT INTO groups (name, created_by)
             VALUES ($1, $2)
             RETURNING id, name, created_by`,
            [name, req.user.userId]
        );

        const group = groupResult.rows[0];

        await pool.query(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1, $2)`,
            [group.id, req.user.userId]
        );

        res.status(201).json({
            message: "Group created successfully",
            group
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/groups", authenticateToken, async (req, res) => {
    try {

        const result = await pool.query(
            `SELECT g.id, g.name, g.created_by
             FROM groups g
             JOIN group_members gm
             ON g.id = gm.group_id
             WHERE gm.user_id = $1
             ORDER BY g.id ASC`,
            [req.user.userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/groups/:groupId/members", authenticateToken, async (req, res) => {
    try {

        const groupId = req.params.groupId;
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                message: "user_id is required"
            });
        }

        const groupResult = await pool.query(
            `SELECT id
             FROM groups
             WHERE id = $1
             AND created_by = $2`,
            [groupId, req.user.userId]
        );

        if (groupResult.rows.length === 0) {
            return res.status(403).json({
                message: "Only the group creator can add members"
            });
        }

        const userResult = await pool.query(
            `SELECT id, name, email
             FROM users
             WHERE id = $1`,
            [user_id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const memberResult = await pool.query(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1, $2)
             RETURNING group_id, user_id`,
            [groupId, user_id]
        );

        res.status(201).json({
            message: "Member added successfully",
            member: memberResult.rows[0]
        });

    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "User is already a member of this group"
            });
        }

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/groups/:groupId/members", authenticateToken, async (req, res) => {
    try {

        const groupId = req.params.groupId;

        const memberCheck = await pool.query(
            `SELECT *
             FROM group_members
             WHERE group_id = $1
             AND user_id = $2`,
            [groupId, req.user.userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        const result = await pool.query(
            `SELECT u.id, u.name, u.email
             FROM users u
             JOIN group_members gm
             ON u.id = gm.user_id
             WHERE gm.group_id = $1
             ORDER BY u.id ASC`,
            [groupId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});