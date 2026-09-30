import api from "./api";

export const getGroupExpenses = async (groupId) => {
    const response = await api.get(
        `/groups/${groupId}/expenses`
    );

    return response.data;
};

export const createExpense = async ({
    group_id,
    description,
    amount,
    date,
}) => {
    const response = await api.post("/expenses", {
        group_id,
        description,
        amount,
        date,
    });

    return response.data;
};

export const splitExpense = async (
    expenseId,
    user_ids
) => {
    const response = await api.post(
        `/expenses/${expenseId}/split`,
        {
            user_ids,
        }
    );

    return response.data;
};

export const getExpenseSplit = async (expenseId) => {
    const response = await api.get(
        `/expenses/${expenseId}/split`
    );

    return response.data;
};

export const deleteExpense = async (expenseId) => {
    const response = await api.delete(
        `/expenses/${expenseId}`
    );

    return response.data;
};