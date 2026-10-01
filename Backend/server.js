require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("./db");
const authenticateToken = require("./middleware/authenticateToken");
const settlementRoutes = require("./routes/settlementRoutes");
const recurringExpenseRoutes = require("./routes/recurringExpenseRoutes");
require("./recurringExpenseScheduler");

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "*",
        credentials: true
    })
);

app.use(express.json());

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


// ===============================
// GET EXPENSES OF A GROUP
// ===============================

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


// ===============================
// CREATE EXPENSE
// ===============================

app.post("/expenses", authenticateToken, async (req, res) => {
    try {

        const {
            group_id,
            description,
            amount,
            date
        } = req.body;

        // Logged-in user becomes the payer
        const userId = req.user.userId;


        // Check whether user belongs to group
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


        // Insert expense
        const result = await pool.query(
            `INSERT INTO expenses
             (group_id, paid_by, description, amount, date)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                group_id,
                userId,
                description,
                amount,
                date
            ]
        );


        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Database error"
        });
    }
});


// ===============================
// REGISTER
// ===============================

app.post("/auth/register", async (req, res) => {
    try {

        const {
            name,
            email,
            password
        } = req.body;


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

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const result = await pool.query(
            `INSERT INTO users
            (name, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, name, email, created_at`,
            [
                name,
                email,
                hashedPassword
            ]
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

        const {
            email,
            password
        } = req.body;


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


        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );


        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        // Create JWT
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

// ===============================
// GOOGLE AUTHENTICATION
// ===============================
const { OAuth2Client } = require("google-auth-library");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "350746927328-jdgj7g2dcudvehvf9ldn5au38k894r07.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.post("/auth/google", async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: "Google credential token is required" });
    }

    let payload;
    try {
        const allowedAudiences = [
            GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_ID,
            process.env.VITE_GOOGLE_CLIENT_ID,
            "350746927328-jdgj7g2dcudvehvf9ldn5au38k894r07.apps.googleusercontent.com"
        ].filter(Boolean);

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: allowedAudiences,
        });

        payload = ticket.getPayload();
    } catch (googleErr) {
        console.error("Google token verification error:", googleErr);
        return res.status(400).json({
            message: "Google token verification failed: " + (googleErr.message || "Invalid token")
        });
    }

    const { email, name } = payload;

    try {
        let userRes = await pool.query(
            "SELECT id, name, email FROM users WHERE email = $1",
            [email]
        );

        let user;
        if (userRes.rows.length > 0) {
            user = userRes.rows[0];
        } else {
            const hashedPassword = await bcrypt.hash(Date.now().toString(), 10);
            const newUserRes = await pool.query(
                `INSERT INTO users (name, email, password)
                 VALUES ($1, $2, $3)
                 RETURNING id, name, email`,
                [name, email, hashedPassword]
            );
            user = newUserRes.rows[0];
        }

        const secret = process.env.JWT_SECRET || "splitx_super_secret_key_change_this";
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            secret,
            { expiresIn: "7d" }
        );

        return res.json({
            message: "Google login successful",
            token,
            user,
        });
    } catch (dbErr) {
        console.error("Database error during Google login:", dbErr);
        return res.status(500).json({
            message: "Database connection error on server: " + (dbErr.message || "Please configure backend database environment variables (DB_HOST/DATABASE_URL).")
        });
    }
});



// ===============================
// GET SINGLE EXPENSE
// ===============================

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


// ===============================
// UPDATE EXPENSE - PUT
// ===============================

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


        // Check membership
        const memberCheck = await pool.query(
            `SELECT *
             FROM group_members
             WHERE group_id = $1
             AND user_id = $2`,
            [
                group_id,
                req.user.userId
            ]
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


// ===============================
// UPDATE EXPENSE - PATCH
// ===============================

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


        // Check membership
        const memberCheck = await pool.query(
            `SELECT *
             FROM group_members
             WHERE group_id = $1
             AND user_id = $2`,
            [
                group_id,
                req.user.userId
            ]
        );


        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }


        // Get existing expense
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


// ===============================
// DELETE EXPENSE
// ===============================

app.delete("/expenses/:id", authenticateToken, async (req, res) => {
    const client = await pool.connect();

    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).json({
                message: "Invalid expense ID"
            });
        }

        await client.query("BEGIN");

        // Check whether expense exists
        const expenseResult = await client.query(
            `SELECT *
             FROM expenses
             WHERE id = $1`,
            [id]
        );

        if (expenseResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Expense not found"
            });
        }

        // Delete all split records first
        await client.query(
            `DELETE FROM expense_splits
             WHERE expense_id = $1`,
            [id]
        );

        // Now delete the expense
        const deleteResult = await client.query(
            `DELETE FROM expenses
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        await client.query("COMMIT");

        res.status(200).json({
            message: "Expense deleted successfully",
            expense: deleteResult.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "DELETE EXPENSE ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to delete expense"
        });

    } finally {
        client.release();
    }
});


// ===============================
// SPLIT EXPENSE
// ===============================

app.post("/expenses/:id/split", authenticateToken, async (req, res) => {
    try {

        const expenseId = Number(req.params.id);

        const {
            user_ids
        } = req.body;


        if (!Array.isArray(user_ids) || user_ids.length === 0) {
            return res.status(400).json({
                message: "user_ids must be a non-empty array"
            });
        }


        // Get expense
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


        // Check users are group members
        const membersResult = await pool.query(
            `SELECT user_id
             FROM group_members
             WHERE group_id = $1
             AND user_id = ANY($2::int[])`,
            [
                expense.group_id,
                user_ids
            ]
        );


        if (membersResult.rows.length !== user_ids.length) {
            return res.status(400).json({
                message: "All users must be members of the group"
            });
        }


        // Calculate equal share
        const share =
            Number(expense.amount) / user_ids.length;


        // Insert splits
        for (const userId of user_ids) {

            await pool.query(
                `INSERT INTO expense_splits
                 (expense_id, user_id, amount)
                 VALUES ($1, $2, $3)`,
                [
                    expenseId,
                    userId,
                    share
                ]
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


// ===============================
// GET EXPENSE SPLIT
// ===============================

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
             JOIN users u
             ON es.user_id = u.id
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

        const paidResult = await pool.query(
            `SELECT
                u.id,
                u.name,
                COALESCE(
                    (
                        SELECT SUM(e.amount)
                        FROM expenses e
                        WHERE e.group_id = $1
                        AND e.paid_by = u.id
                    ),
                    0
                ) AS total_paid,

                COALESCE(
                    (
                        SELECT SUM(es.amount)
                        FROM expense_splits es
                        JOIN expenses e
                        ON e.id = es.expense_id
                        WHERE e.group_id = $1
                        AND es.user_id = u.id
                    ),
                    0
                ) AS total_owed

             FROM users u
             JOIN group_members gm
             ON gm.user_id = u.id

             WHERE gm.group_id = $1

             ORDER BY u.id`,
            [groupId]
        );

        const balances = paidResult.rows.map(user => ({
            id: user.id,
            name: user.name,
            total_paid: Number(user.total_paid),
            total_owed: Number(user.total_owed),
            balance: Number(user.total_paid) - Number(user.total_owed)
        }));

        res.status(200).json(balances);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/groups", authenticateToken, async (req, res) => {
    try {

        const {
            name
        } = req.body;


        if (!name) {
            return res.status(400).json({
                message: "Group name is required"
            });
        }

        const groupResult = await pool.query(
            `INSERT INTO groups
             (name, created_by)
             VALUES ($1, $2)
             RETURNING id, name, created_by`,
            [
                name,
                req.user.userId
            ]
        );


        const group = groupResult.rows[0];

        await pool.query(
            `INSERT INTO group_members
             (group_id, user_id)
             VALUES ($1, $2)`,
            [
                group.id,
                req.user.userId
            ]
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
            `SELECT
                g.id,
                g.name,
                g.created_by

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

// ===============================
// DELETE GROUP (ADMIN ONLY)
// ===============================
app.delete("/groups/:groupId", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const groupId = req.params.groupId;
        const userId = req.user.userId;

        const groupRes = await client.query(
            `SELECT id, name, created_by FROM groups WHERE id = $1`,
            [groupId]
        );

        if (groupRes.rows.length === 0) {
            return res.status(404).json({ message: "Group not found" });
        }

        const group = groupRes.rows[0];

        if (String(group.created_by) !== String(userId)) {
            return res.status(403).json({
                message: "Only the group creator (admin) can delete this group."
            });
        }

        await client.query("BEGIN");

        // Delete associated expense splits
        await client.query(
            `DELETE FROM expense_splits WHERE expense_id IN (SELECT id FROM expenses WHERE group_id = $1)`,
            [groupId]
        ).catch(() => {});

        // Delete associated expenses
        await client.query(`DELETE FROM expenses WHERE group_id = $1`, [groupId]).catch(() => {});

        // Delete associated settlements (if table exists)
        await client.query(`DELETE FROM settlements WHERE group_id = $1`, [groupId]).catch(() => {});

        // Delete associated recurring expenses (if table exists)
        await client.query(`DELETE FROM recurring_expenses WHERE group_id = $1`, [groupId]).catch(() => {});

        // Delete group members
        await client.query(`DELETE FROM group_members WHERE group_id = $1`, [groupId]);

        // Delete group
        await client.query(`DELETE FROM groups WHERE id = $1`, [groupId]);

        await client.query("COMMIT");

        res.json({ message: "Group deleted successfully" });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error deleting group:", error);
        res.status(500).json({ message: "Server error deleting group" });
    } finally {
        client.release();
    }
});



// ===============================
// ADD GROUP MEMBER
// ===============================

app.post("/groups/:groupId/members", authenticateToken, async (req, res) => {
    try {
        const groupId = req.params.groupId;
        const identifier = (req.body.username || req.body.email || req.body.user_id || req.body.identifier || "").toString().trim();

        if (!identifier) {
            return res.status(400).json({
                message: "Username, email, or user ID is required"
            });
        }

        // Check group creator
        const groupResult = await pool.query(
            `SELECT id FROM groups WHERE id = $1 AND created_by = $2`,
            [groupId, req.user.userId]
        );

        if (groupResult.rows.length === 0) {
            return res.status(403).json({
                message: "Only the group creator can add members"
            });
        }

        // Search user by email, name (username), or numeric ID
        const userResult = await pool.query(
            `SELECT id, name, email
             FROM users
             WHERE LOWER(email) = LOWER($1)
                OR LOWER(name) = LOWER($1)
                OR id::text = $1`,
            [identifier]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: `User '${identifier}' not found`
            });
        }

        const targetUser = userResult.rows[0];

        // Add member
        const memberResult = await pool.query(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1, $2)
             RETURNING group_id, user_id`,
            [groupId, targetUser.id]
        );

        res.status(201).json({
            message: "Member added successfully",
            member: {
                ...memberResult.rows[0],
                name: targetUser.name,
                email: targetUser.email
            }
        });
    } catch (error) {
        console.error(error);
        if (error.code === "23505") {
            return res.status(409).json({
                message: "User is already a member of this group"
            });
        }
        res.status(500).json({
            message: "Server error adding member"
        });
    }
});




// ===============================
// EXIT / REMOVE GROUP MEMBER
// ===============================
app.delete("/groups/:groupId/members/:targetUserId", authenticateToken, async (req, res) => {
    try {
        const { groupId, targetUserId } = req.params;
        const currentUserId = req.user.userId;

        // Fetch group to check creator
        const groupResult = await pool.query(
            `SELECT id, created_by FROM groups WHERE id = $1`,
            [groupId]
        );

        if (groupResult.rows.length === 0) {
            return res.status(404).json({ message: "Group not found" });
        }

        const group = groupResult.rows[0];
        const isCreator = Number(currentUserId) === Number(group.created_by);
        const isSelfExit = Number(currentUserId) === Number(targetUserId);

        // Group creator cannot leave
        if (Number(targetUserId) === Number(group.created_by)) {
            return res.status(400).json({
                message: "Group creator cannot leave the group. Delete the group instead if needed."
            });
        }

        // Non-creator members cannot directly leave. They must use the leave-request feature.
        if (isSelfExit && !isCreator) {
            return res.status(403).json({
                message: "Group members cannot leave directly. Please submit a leave request for the group creator to approve."
            });
        }

        // Only group creator can remove other members directly
        if (!isCreator) {
            return res.status(403).json({
                message: "Only the group creator (admin) can remove members from this group."
            });
        }

        // Remove from group_members
        const deleteRes = await pool.query(
            `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING *`,
            [groupId, targetUserId]
        );

        if (deleteRes.rows.length === 0) {
            return res.status(404).json({ message: "Member is not in this group" });
        }

        // Also clean up any pending leave requests for this user in this group
        await pool.query(
            `DELETE FROM group_leave_requests WHERE group_id = $1 AND user_id = $2`,
            [groupId, targetUserId]
        );

        res.json({ message: "Member removed from group successfully" });
    } catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ message: "Server error removing member" });
    }
});


// ===============================
// LEAVE REQUEST ENDPOINTS
// ===============================

// 1. SUBMIT LEAVE REQUEST (Regular Member)
app.post("/groups/:groupId/leave-request", authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.userId;

        // Check if group exists
        const groupRes = await pool.query(
            `SELECT id, created_by FROM groups WHERE id = $1`,
            [groupId]
        );

        if (groupRes.rows.length === 0) {
            return res.status(404).json({ message: "Group not found" });
        }

        const group = groupRes.rows[0];

        // Creator cannot submit leave request
        if (Number(userId) === Number(group.created_by)) {
            return res.status(400).json({
                message: "Group creator cannot submit a leave request. Delete the group or transfer ownership if needed."
            });
        }

        // Check if user is in group
        const memberRes = await pool.query(
            `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
            [groupId, userId]
        );

        if (memberRes.rows.length === 0) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        // Check if pending request already exists
        const existingReq = await pool.query(
            `SELECT * FROM group_leave_requests WHERE group_id = $1 AND user_id = $2 AND status = 'pending'`,
            [groupId, userId]
        );

        if (existingReq.rows.length > 0) {
            return res.status(400).json({
                message: "You already have a pending leave request for this group.",
                request: existingReq.rows[0]
            });
        }

        // Insert new leave request
        const insertRes = await pool.query(
            `INSERT INTO group_leave_requests (group_id, user_id, status)
             VALUES ($1, $2, 'pending')
             RETURNING *`,
            [groupId, userId]
        );

        res.status(201).json({
            message: "Leave request submitted to group creator for approval",
            request: insertRes.rows[0]
        });
    } catch (error) {
        console.error("Error submitting leave request:", error);
        res.status(500).json({ message: "Server error submitting leave request" });
    }
});

// 2. CANCEL LEAVE REQUEST (Regular Member)
app.delete("/groups/:groupId/leave-request", authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.userId;

        const deleteRes = await pool.query(
            `DELETE FROM group_leave_requests
             WHERE group_id = $1 AND user_id = $2 AND status = 'pending'
             RETURNING *`,
            [groupId, userId]
        );

        if (deleteRes.rows.length === 0) {
            return res.status(404).json({ message: "No pending leave request found to cancel" });
        }

        res.json({ message: "Leave request cancelled successfully" });
    } catch (error) {
        console.error("Error cancelling leave request:", error);
        res.status(500).json({ message: "Server error cancelling leave request" });
    }
});

// 3. GET LEAVE REQUESTS FOR A GROUP
app.get("/groups/:groupId/leave-requests", authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.userId;

        // Verify membership
        const memberRes = await pool.query(
            `SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2`,
            [groupId, userId]
        );

        if (memberRes.rows.length === 0) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        const requestsRes = await pool.query(
            `SELECT 
                glr.*,
                u.name AS user_name,
                u.email AS user_email
             FROM group_leave_requests glr
             JOIN users u ON glr.user_id = u.id
             WHERE glr.group_id = $1 AND glr.status = 'pending'
             ORDER BY glr.requested_at DESC`,
            [groupId]
        );

        res.json({ requests: requestsRes.rows });
    } catch (error) {
        console.error("Error fetching leave requests:", error);
        res.status(500).json({ message: "Server error fetching leave requests" });
    }
});

// 4. APPROVE LEAVE REQUEST (Group Creator Only)
app.post("/groups/:groupId/leave-requests/:requestId/approve", authenticateToken, async (req, res) => {
    try {
        const { groupId, requestId } = req.params;
        const currentUserId = req.user.userId;

        // Fetch group to check creator
        const groupRes = await pool.query(
            `SELECT id, created_by FROM groups WHERE id = $1`,
            [groupId]
        );

        if (groupRes.rows.length === 0) {
            return res.status(404).json({ message: "Group not found" });
        }

        const group = groupRes.rows[0];
        if (Number(currentUserId) !== Number(group.created_by)) {
            return res.status(403).json({ message: "Only the group creator can approve leave requests" });
        }

        // Fetch request
        const reqRes = await pool.query(
            `SELECT * FROM group_leave_requests WHERE id = $1 AND group_id = $2 AND status = 'pending'`,
            [requestId, groupId]
        );

        if (reqRes.rows.length === 0) {
            return res.status(404).json({ message: "Pending leave request not found" });
        }

        const leaveReq = reqRes.rows[0];

        // Update status to approved
        await pool.query(
            `UPDATE group_leave_requests SET status = 'approved', processed_at = NOW() WHERE id = $1`,
            [requestId]
        );

        // Remove from group_members
        await pool.query(
            `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
            [groupId, leaveReq.user_id]
        );

        res.json({ message: "Leave request approved. Member has been removed from group." });
    } catch (error) {
        console.error("Error approving leave request:", error);
        res.status(500).json({ message: "Server error approving leave request" });
    }
});

// 5. REJECT LEAVE REQUEST (Group Creator Only)
app.post("/groups/:groupId/leave-requests/:requestId/reject", authenticateToken, async (req, res) => {
    try {
        const { groupId, requestId } = req.params;
        const currentUserId = req.user.userId;

        // Fetch group to check creator
        const groupRes = await pool.query(
            `SELECT id, created_by FROM groups WHERE id = $1`,
            [groupId]
        );

        if (groupRes.rows.length === 0) {
            return res.status(404).json({ message: "Group not found" });
        }

        const group = groupRes.rows[0];
        if (Number(currentUserId) !== Number(group.created_by)) {
            return res.status(403).json({ message: "Only the group creator can reject leave requests" });
        }

        // Fetch request
        const reqRes = await pool.query(
            `SELECT * FROM group_leave_requests WHERE id = $1 AND group_id = $2 AND status = 'pending'`,
            [requestId, groupId]
        );

        if (reqRes.rows.length === 0) {
            return res.status(404).json({ message: "Pending leave request not found" });
        }

        // Update status to rejected
        await pool.query(
            `UPDATE group_leave_requests SET status = 'rejected', processed_at = NOW() WHERE id = $1`,
            [requestId]
        );

        res.json({ message: "Leave request rejected." });
    } catch (error) {
        console.error("Error rejecting leave request:", error);
        res.status(500).json({ message: "Server error rejecting leave request" });
    }
});


// ===============================
// GET GROUP MEMBERS
// ===============================

app.get("/groups/:groupId/members", authenticateToken, async (req, res) => {
    try {

        const groupId = req.params.groupId;


        // Check membership
        const memberCheck = await pool.query(
            `SELECT *
             FROM group_members
             WHERE group_id = $1
             AND user_id = $2`,
            [
                groupId,
                req.user.userId
            ]
        );


        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }


        const result = await pool.query(
            `SELECT
                u.id,
                u.name,
                u.email

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

app.use("/", settlementRoutes);
app.use("/", recurringExpenseRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
