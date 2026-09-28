const express = require("express");

const router = express.Router();

const pool = require("../db");
const authenticateToken = require("../middleware/authenticateToken");


// =====================================================
// HELPER FUNCTION
// Calculate current balances of all users in a group
// =====================================================

async function calculateBalances(groupId) {

    const expensesResult = await pool.query(
        `
        SELECT id, paid_by, amount
        FROM expenses
        WHERE group_id = $1
        `,
        [groupId]
    );


    const splitsResult = await pool.query(
        `
        SELECT es.user_id, es.amount
        FROM expense_splits es
        JOIN expenses e
            ON es.expense_id = e.id
        WHERE e.group_id = $1
        `,
        [groupId]
    );


    const settlementsResult = await pool.query(
        `
        SELECT from_user, to_user, amount
        FROM settlements
        WHERE group_id = $1
        `,
        [groupId]
    );


    const balances = {};


    // -------------------------------------------------
    // Add money paid by each user
    // -------------------------------------------------

    for (const expense of expensesResult.rows) {

        const userId = expense.paid_by;

        if (userId === null) {
            continue;
        }

        if (!balances[userId]) {
            balances[userId] = 0;
        }

        balances[userId] += Number(expense.amount);
    }


    // -------------------------------------------------
    // Subtract money owed by each user
    // -------------------------------------------------

    for (const split of splitsResult.rows) {

        const userId = split.user_id;

        if (!balances[userId]) {
            balances[userId] = 0;
        }

        balances[userId] -= Number(split.amount);
    }


    // -------------------------------------------------
    // Apply completed settlements
    //
    // from_user pays to_user
    //
    // from_user balance increases
    // to_user balance decreases
    // -------------------------------------------------

    for (const settlement of settlementsResult.rows) {

        const fromUser = settlement.from_user;
        const toUser = settlement.to_user;
        const amount = Number(settlement.amount);

        if (!balances[fromUser]) {
            balances[fromUser] = 0;
        }

        if (!balances[toUser]) {
            balances[toUser] = 0;
        }

        balances[fromUser] += amount;
        balances[toUser] -= amount;
    }


    return balances;
}



// =====================================================
// GET CURRENT SETTLEMENTS
// GET /groups/:groupId/settlements
// =====================================================

router.get(
    "/groups/:groupId/settlements",
    authenticateToken,
    async (req, res) => {

        const { groupId } = req.params;

        try {

            const balances = await calculateBalances(groupId);


            const creditors = [];
            const debtors = [];


            // -------------------------------------------------
            // Separate creditors and debtors
            // -------------------------------------------------

            for (const userId in balances) {

                const balance = Number(
                    balances[userId].toFixed(2)
                );


                if (balance > 0) {

                    creditors.push({
                        userId: Number(userId),
                        amount: balance
                    });

                } else if (balance < 0) {

                    debtors.push({
                        userId: Number(userId),
                        amount: Math.abs(balance)
                    });
                }
            }


            // -------------------------------------------------
            // Min-Cashflow settlement algorithm
            // -------------------------------------------------

            const settlements = [];

            let i = 0;
            let j = 0;


            while (
                i < debtors.length &&
                j < creditors.length
            ) {

                const debtor = debtors[i];
                const creditor = creditors[j];


                const amount = Math.min(
                    debtor.amount,
                    creditor.amount
                );


                settlements.push({
                    from: debtor.userId,
                    to: creditor.userId,
                    amount: Number(amount.toFixed(2))
                });


                debtor.amount -= amount;
                creditor.amount -= amount;


                if (Math.abs(debtor.amount) < 0.01) {
                    i++;
                }


                if (Math.abs(creditor.amount) < 0.01) {
                    j++;
                }
            }


            res.json({
                groupId: Number(groupId),
                balances,
                settlements
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to calculate settlements"
            });
        }
    }
);



// =====================================================
// POST RECORD SETTLEMENT
// POST /groups/:groupId/settlements
// =====================================================

router.post(
    "/groups/:groupId/settlements",
    authenticateToken,
    async (req, res) => {

        const { groupId } = req.params;

        const { to_user, amount } = req.body;

        // IMPORTANT:
        // JWT contains userId, not id
        const from_user = req.user.userId;


        try {

            // -------------------------------------------------
            // Validate input
            // -------------------------------------------------

            if (!to_user || amount === undefined) {

                return res.status(400).json({
                    message: "to_user and amount are required"
                });
            }


            const settlementAmount = Number(amount);


            if (
                !Number.isFinite(settlementAmount) ||
                settlementAmount <= 0
            ) {

                return res.status(400).json({
                    message: "Amount must be greater than 0"
                });
            }


            if (Number(to_user) === Number(from_user)) {

                return res.status(400).json({
                    message: "You cannot settle with yourself"
                });
            }



            // -------------------------------------------------
            // Check whether both users are group members
            // -------------------------------------------------

            const membersResult = await pool.query(
                `
                SELECT user_id
                FROM group_members
                WHERE group_id = $1
                AND user_id IN ($2, $3)
                `,
                [groupId, from_user, to_user]
            );


            if (membersResult.rows.length !== 2) {

                return res.status(400).json({
                    message: "Both users must be members of the group"
                });
            }



            // -------------------------------------------------
            // Calculate current balances
            // -------------------------------------------------

            const balances = await calculateBalances(groupId);


            const fromBalance = Number(
                (balances[from_user] || 0).toFixed(2)
            );


            const toBalance = Number(
                (balances[to_user] || 0).toFixed(2)
            );



            // -------------------------------------------------
            // Payer must actually owe money
            // -------------------------------------------------

            if (fromBalance >= 0) {

                return res.status(400).json({
                    message: "You do not currently owe money in this group"
                });
            }



            // -------------------------------------------------
            // Receiver must actually be owed money
            // -------------------------------------------------

            if (toBalance <= 0) {

                return res.status(400).json({
                    message: "The selected user is not currently owed money"
                });
            }



            // -------------------------------------------------
            // Maximum amount that can be settled
            // -------------------------------------------------

            const amountOwed = Math.abs(fromBalance);

            const maxReceivable = toBalance;

            const maximumAllowed = Math.min(
                amountOwed,
                maxReceivable
            );


            // -------------------------------------------------
            // Prevent overpayment
            // -------------------------------------------------

            if (
                settlementAmount >
                maximumAllowed + 0.01
            ) {

                return res.status(400).json({
                    message: `Settlement amount cannot exceed ₹${maximumAllowed.toFixed(2)}`
                });
            }



            // -------------------------------------------------
            // Record settlement
            // -------------------------------------------------

            const result = await pool.query(
                `
                INSERT INTO settlements
                    (group_id, from_user, to_user, amount)
                VALUES
                    ($1, $2, $3, $4)
                RETURNING *
                `,
                [
                    groupId,
                    from_user,
                    to_user,
                    settlementAmount
                ]
            );


            res.status(201).json({

                message: "Settlement recorded successfully",

                settlement: result.rows[0]

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to record settlement"
            });
        }
    }
);



// =====================================================
// GET SETTLEMENT HISTORY
// GET /groups/:groupId/settlements/history
// =====================================================

router.get(
    "/groups/:groupId/settlements/history",
    authenticateToken,
    async (req, res) => {

        const { groupId } = req.params;


        try {

            const result = await pool.query(
                `
                SELECT
                    s.id,
                    s.group_id,
                    s.from_user,
                    fu.name AS from_user_name,
                    s.to_user,
                    tu.name AS to_user_name,
                    s.amount,
                    s.created_at

                FROM settlements s

                JOIN users fu
                    ON s.from_user = fu.id

                JOIN users tu
                    ON s.to_user = tu.id

                WHERE s.group_id = $1

                ORDER BY s.created_at DESC
                `,
                [groupId]
            );


            res.json({

                groupId: Number(groupId),

                settlements: result.rows

            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Failed to fetch settlement history"
            });
        }
    }
);



module.exports = router;