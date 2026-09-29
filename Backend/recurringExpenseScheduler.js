const cron = require("node-cron");
const pool = require("./db");

async function processRecurringExpenses() {
    console.log("Checking recurring expenses...");

    try {
        const result = await pool.query(`
            SELECT *
            FROM recurring_expenses
            WHERE next_due_date <= CURRENT_DATE
        `);

        for (const recurring of result.rows) {
            const client = await pool.connect();

            try {
                await client.query("BEGIN");

                // Re-check and lock this recurring expense
                // to prevent duplicate processing
                const lockedResult = await client.query(
                    `
                    SELECT *
                    FROM recurring_expenses
                    WHERE id = $1
                    AND next_due_date <= CURRENT_DATE
                    FOR UPDATE
                    `,
                    [recurring.id]
                );

                if (lockedResult.rows.length === 0) {
                    await client.query("ROLLBACK");
                    client.release();
                    continue;
                }

                const currentRecurring = lockedResult.rows[0];

                // ---------------------------------------------
                // 1. Get all members of the group
                // ---------------------------------------------
                const membersResult = await client.query(
                    `
                    SELECT user_id
                    FROM group_members
                    WHERE group_id = $1
                    ORDER BY user_id
                    `,
                    [currentRecurring.group_id]
                );

                const members = membersResult.rows;

                if (members.length === 0) {
                    throw new Error(
                        `No members found for group ${currentRecurring.group_id}`
                    );
                }

                // ---------------------------------------------
                // 2. Create the normal expense
                // ---------------------------------------------
                const expenseResult = await client.query(
                    `
                    INSERT INTO expenses
                        (group_id, paid_by, description, amount, date)
                    VALUES
                        ($1, $2, $3, $4, CURRENT_DATE)
                    RETURNING id
                    `,
                    [
                        currentRecurring.group_id,
                        currentRecurring.paid_by,
                        currentRecurring.description,
                        currentRecurring.amount
                    ]
                );

                const expenseId = expenseResult.rows[0].id;

                // ---------------------------------------------
                // 3. Calculate equal split
                // ---------------------------------------------
                const totalAmount = Number(currentRecurring.amount);
                const memberCount = members.length;

                const baseAmount =
                    Math.floor((totalAmount / memberCount) * 100) / 100;

                let distributedAmount = 0;
                for (let i = 0; i < members.length; i++) {
                    let splitAmount;

                    if (i === members.length - 1) {
                        splitAmount = Number(
                            (totalAmount - distributedAmount).toFixed(2)
                        );
                    } else {
                        splitAmount = Number(baseAmount.toFixed(2));
                    }

                    await client.query(
                        `
                        INSERT INTO expense_splits
                            (expense_id, user_id, amount)
                        VALUES
                            ($1, $2, $3)
                        `,
                        [
                            expenseId,
                            members[i].user_id,
                            splitAmount
                        ]
                    );

                    distributedAmount += splitAmount;
                }

                let updateQuery;

                if (currentRecurring.frequency === "daily") {
                    updateQuery = `
                        UPDATE recurring_expenses
                        SET next_due_date = next_due_date + INTERVAL '1 day'
                        WHERE id = $1
                    `;
                } else if (currentRecurring.frequency === "weekly") {
                    updateQuery = `
                        UPDATE recurring_expenses
                        SET next_due_date = next_due_date + INTERVAL '1 week'
                        WHERE id = $1
                    `;
                } else if (currentRecurring.frequency === "monthly") {
                    updateQuery = `
                        UPDATE recurring_expenses
                        SET next_due_date = next_due_date + INTERVAL '1 month'
                        WHERE id = $1
                    `;
                } else if (currentRecurring.frequency === "yearly") {
                    updateQuery = `
                        UPDATE recurring_expenses
                        SET next_due_date = next_due_date + INTERVAL '1 year'
                        WHERE id = $1
                    `;
                } else {
                    throw new Error(
                        `Invalid frequency: ${currentRecurring.frequency}`
                    );
                }

                await client.query(updateQuery, [currentRecurring.id]);

                await client.query("COMMIT");

                console.log(
                    `Processed recurring expense ID: ${currentRecurring.id}`
                );

                console.log(
                    `Created expense ID: ${expenseId}`
                );

                console.log(
                    `Created ${memberCount} expense splits`
                );

            } catch (error) {
                await client.query("ROLLBACK");

                console.error(
                    `Failed to process recurring expense ID ${recurring.id}:`,
                    error.message
                );
            } finally {
                client.release();
            }
        }

    } catch (error) {
        console.error(
            "Recurring expense scheduler error:",
            error
        );
    }
}

cron.schedule("* * * * *", () => {
    processRecurringExpenses();
});


module.exports = processRecurringExpenses;