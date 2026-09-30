import api from "./api";

// ==========================================
// GET RECURRING EXPENSES
// ==========================================

export const getRecurringExpenses = async (groupId) => {
    const response = await api.get(
        `/recurring-expenses/${groupId}`
    );

    return response.data;
};


// ==========================================
// CREATE RECURRING EXPENSE
// ==========================================

export const createRecurringExpense = async (data) => {
    const response = await api.post(
        "/recurring-expenses",
        data
    );

    return response.data;
};


// ==========================================
// UPDATE RECURRING EXPENSE
// ==========================================

export const updateRecurringExpense = async (id, data) => {
    const response = await api.patch(
        `/recurring-expenses/${id}`,
        data
    );

    return response.data;
};


// ==========================================
// DELETE RECURRING EXPENSE
// ==========================================

export const deleteRecurringExpense = async (id) => {
    const response = await api.delete(
        `/recurring-expenses/${id}`
    );

    return response.data;
};