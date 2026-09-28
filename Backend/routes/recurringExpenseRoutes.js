const express = require("express");

const router = express.Router();

const pool = require("../db");

const authenticateToken = require("../middleware/authenticateToken");

// =====================================================
// POST /recurring-expenses
// Create a recurring expense
// =====================================================

router.post(
    "/recurring-expenses",
    authenticateToken,
    async (req, res) => {
        const {
            group_id,
            description,
            amount,
            paid_by,
            frequency,
            next_due_date
        } = req.body;

        try {
            // Validate required fields
            if (
                !group_id ||
                !description ||
                amount === undefined ||
                !paid_by ||
                !frequency ||
                !next_due_date
            ) {
                return res.status(400).json({
                    message: "All fields are required"
                });
            }

            // Validate amount
            const expenseAmount = Number(amount);

            if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
                return res.status(400).json({
                    message: "Amount must be greater than 0"
                });
            }

            // Validate frequency
            const allowedFrequencies = [
                "daily",
                "weekly",
                "monthly",
                "yearly"
            ];

            if (!allowedFrequencies.includes(frequency.toLowerCase())) {
                return res.status(400).json({
                    message:
                        "Frequency must be daily, weekly, monthly or yearly"
                });
            }

            // Check whether logged-in user is a group member
            const memberResult = await pool.query(
                `
                SELECT user_id
                FROM group_members
                WHERE group_id = $1
                AND user_id = $2
                `,
                [group_id, req.user.userId]
            );

            if (memberResult.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this group"
                });
            }

            // Check whether paid_by is a group member
            const paidByResult = await pool.query(
                `
                SELECT user_id
                FROM group_members
                WHERE group_id = $1
                AND user_id = $2
                `,
                [group_id, paid_by]
            );

            if (paidByResult.rows.length === 0) {
                return res.status(400).json({
                    message: "paid_by user must be a member of the group"
                });
            }

            // Create recurring expense
            const result = await pool.query(
                `
                INSERT INTO recurring_expenses
                    (
                        group_id,
                        description,
                        amount,
                        paid_by,
                        frequency,
                        next_due_date
                    )
                VALUES
                    ($1, $2, $3, $4, $5, $6)
                RETURNING *
                `,
                [
                    group_id,
                    description,
                    expenseAmount,
                    paid_by,
                    frequency.toLowerCase(),
                    next_due_date
                ]
            );

            res.status(201).json({
                message: "Recurring expense created successfully",
                recurring_expense: result.rows[0]
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to create recurring expense"
            });
        }
    }
);


// =====================================================
// GET /recurring-expenses/:groupId
// Get recurring expenses for a group
// =====================================================

router.get(
    "/recurring-expenses/:groupId",
    authenticateToken,
    async (req, res) => {
        const { groupId } = req.params;

        try {
            // Check membership
            const memberResult = await pool.query(
                `
                SELECT user_id
                FROM group_members
                WHERE group_id = $1
                AND user_id = $2
                `,
                [groupId, req.user.userId]
            );

            if (memberResult.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this group"
                });
            }

            const result = await pool.query(
                `
                SELECT
                    r.id,
                    r.group_id,
                    r.description,
                    r.amount,
                    r.paid_by,
                    u.name AS paid_by_name,
                    r.frequency,
                    r.next_due_date,
                    r.created_at
                FROM recurring_expenses r
                JOIN users u
                    ON r.paid_by = u.id
                WHERE r.group_id = $1
                ORDER BY r.next_due_date ASC
                `,
                [groupId]
            );

            res.json({
                groupId: Number(groupId),
                recurring_expenses: result.rows
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to fetch recurring expenses"
            });
        }
    }
);


// =====================================================
// DELETE /recurring-expenses/:id
// Delete a recurring expense
// =====================================================

router.delete(
    "/recurring-expenses/:id",
    authenticateToken,
    async (req, res) => {
        const { id } = req.params;

        try {
            // Check whether recurring expense exists
            const expenseResult = await pool.query(
                `
                SELECT *
                FROM recurring_expenses
                WHERE id = $1
                `,
                [id]
            );

            if (expenseResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Recurring expense not found"
                });
            }

            const recurringExpense = expenseResult.rows[0];

            // Check whether logged-in user belongs to group
            const memberResult = await pool.query(
                `
                SELECT user_id
                FROM group_members
                WHERE group_id = $1
                AND user_id = $2
                `,
                [
                    recurringExpense.group_id,
                    req.user.userId
                ]
            );

            if (memberResult.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this group"
                });
            }

            // Delete recurring expense
            await pool.query(
                `
                DELETE FROM recurring_expenses
                WHERE id = $1
                `,
                [id]
            );

            res.json({
                message: "Recurring expense deleted successfully"
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to delete recurring expense"
            });
        }
    }
);


// =====================================================
// PATCH /recurring-expenses/:id
// Update a recurring expense
// =====================================================

router.patch(
    "/recurring-expenses/:id",
    authenticateToken,
    async (req, res) => {
        const { id } = req.params;

        const {
            description,
            amount,
            paid_by,
            frequency,
            next_due_date
        } = req.body;

        try {
            // Check whether recurring expense exists
            const expenseResult = await pool.query(
                `
                SELECT *
                FROM recurring_expenses
                WHERE id = $1
                `,
                [id]
            );

            if (expenseResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Recurring expense not found"
                });
            }

            const existingExpense = expenseResult.rows[0];

            // Check whether logged-in user belongs to group
            const memberResult = await pool.query(
                `
                SELECT user_id
                FROM group_members
                WHERE group_id = $1
                AND user_id = $2
                `,
                [
                    existingExpense.group_id,
                    req.user.userId
                ]
            );

            if (memberResult.rows.length === 0) {
                return res.status(403).json({
                    message: "You are not a member of this group"
                });
            }

            // Validate description if provided
            if (
                description !== undefined &&
                description.trim() === ""
            ) {
                return res.status(400).json({
                    message: "Description cannot be empty"
                });
            }

            // Validate amount if provided
            let updatedAmount = null;

            if (amount !== undefined) {
                updatedAmount = Number(amount);

                if (
                    !Number.isFinite(updatedAmount) ||
                    updatedAmount <= 0
                ) {
                    return res.status(400).json({
                        message: "Amount must be greater than 0"
                    });
                }
            }

            // Validate frequency if provided
            const allowedFrequencies = [
                "daily",
                "weekly",
                "monthly",
                "yearly"
            ];

            let updatedFrequency = null;

            if (frequency !== undefined) {
                updatedFrequency = frequency.toLowerCase();

                if (!allowedFrequencies.includes(updatedFrequency)) {
                    return res.status(400).json({
                        message:
                            "Frequency must be daily, weekly, monthly or yearly"
                    });
                }
            }

            // Validate paid_by if provided
            if (paid_by !== undefined) {
                const paidByResult = await pool.query(
                    `
                    SELECT user_id
                    FROM group_members
                    WHERE group_id = $1
                    AND user_id = $2
                    `,
                    [
                        existingExpense.group_id,
                        paid_by
                    ]
                );

                if (paidByResult.rows.length === 0) {
                    return res.status(400).json({
                        message:
                            "paid_by user must be a member of the group"
                    });
                }
            }

            // Update recurring expense
            const result = await pool.query(
                `
                UPDATE recurring_expenses
                SET
                    description = COALESCE($1, description),
                    amount = COALESCE($2, amount),
                    paid_by = COALESCE($3, paid_by),
                    frequency = COALESCE($4, frequency),
                    next_due_date = COALESCE($5, next_due_date)
                WHERE id = $6
                RETURNING *
                `,
                [
                    description !== undefined
                        ? description.trim()
                        : null,

                    updatedAmount,

                    paid_by !== undefined
                        ? paid_by
                        : null,

                    updatedFrequency,

                    next_due_date !== undefined
                        ? next_due_date
                        : null,

                    id
                ]
            );

            res.json({
                message: "Recurring expense updated successfully",
                recurring_expense: result.rows[0]
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to update recurring expense"
            });
        }
    }
);


module.exports = router;