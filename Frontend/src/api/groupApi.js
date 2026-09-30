import api from "./api";

export const getGroups = async () => {
    const response = await api.get("/groups");

    return response.data;
};

export const createGroup = async (name) => {
    const response = await api.post("/groups", {
        name,
    });

    return response.data;
};

export const getGroupMembers = async (groupId) => {
    const response = await api.get(
        `/groups/${groupId}/members`
    );

    return response.data;
};

export const getGroupBalances = async (groupId) => {
    const response = await api.get(
        `/groups/${groupId}/balances`
    );

    return response.data;
};

export const addGroupMember = async (groupId, identifier) => {
    const response = await api.post(
        `/groups/${groupId}/members`,
        {
            identifier,
            username: identifier,
        }
    );

    return response.data;
};

export const removeGroupMember = async (groupId, targetUserId) => {
    const response = await api.delete(
        `/groups/${groupId}/members/${targetUserId}`
    );

    return response.data;
};

export const deleteGroup = async (groupId) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
};

export const getDashboardSummary = async () => {
    const response = await api.get("/dashboard/summary");
    return response.data;
};

export const requestLeaveGroup = async (groupId) => {
    const response = await api.post(`/groups/${groupId}/leave-request`);
    return response.data;
};

export const cancelLeaveRequest = async (groupId) => {
    const response = await api.delete(`/groups/${groupId}/leave-request`);
    return response.data;
};

export const getLeaveRequests = async (groupId) => {
    const response = await api.get(`/groups/${groupId}/leave-requests`);
    return response.data;
};

export const approveLeaveRequest = async (groupId, requestId) => {
    const response = await api.post(`/groups/${groupId}/leave-requests/${requestId}/approve`);
    return response.data;
};

export const rejectLeaveRequest = async (groupId, requestId) => {
    const response = await api.post(`/groups/${groupId}/leave-requests/${requestId}/reject`);
    return response.data;
};


