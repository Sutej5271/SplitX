import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Users,
    Wallet,
    RefreshCw,
    Plus,
    Receipt,
    LogOut,
    UserX,
    Crown,
    AlertTriangle,
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    ShieldAlert,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AddExpenseModal from "../components/AddExpenseModal";
import ExpenseDetailsModal from "../components/ExpenseDetailsModal";
import AddMemberModal from "../components/AddMemberModal";
import { useAuth } from "../context/AuthContext";

import {
    getGroups,
    getGroupMembers,
    getGroupBalances,
    removeGroupMember,
    deleteGroup,
    requestLeaveGroup,
    cancelLeaveRequest,
    getLeaveRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
} from "../api/groupApi";

import {
    getGroupExpenses,
} from "../api/expenseApi";

const GroupDetails = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // =========================
    // STATE
    // =========================
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [balances, setBalances] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);

    // Member Exit/Remove Modal State
    const [memberToExit, setMemberToExit] = useState(null);
    const [exitingMember, setExitingMember] = useState(false);

    // Leave Request State
    const [leaveModalMember, setLeaveModalMember] = useState(null);
    const [requestingLeave, setRequestingLeave] = useState(false);

    // Delete Group Modal State
    const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
    const [deletingGroup, setDeletingGroup] = useState(false);

    const isCreator = String(user?.id) === String(group?.created_by);

    const handleDeleteGroupConfirm = async () => {
        try {
            setDeletingGroup(true);
            await deleteGroup(groupId);
            setShowDeleteGroupModal(false);
            navigate("/dashboard");
        } catch (err) {
            console.error("Failed to delete group:", err);
            alert(err.response?.data?.message || "Failed to delete group");
        } finally {
            setDeletingGroup(false);
        }
    };

    const handleRemoveMemberConfirm = async () => {
        if (!memberToExit) return;
        try {
            setExitingMember(true);
            await removeGroupMember(groupId, memberToExit.id);
            setMemberToExit(null);
            await loadGroupData();
        } catch (err) {
            console.error("Failed to remove member:", err);
            alert(err.response?.data?.message || "Failed to remove member");
        } finally {
            setExitingMember(false);
        }
    };

    const handleRequestLeaveSubmit = async () => {
        try {
            setRequestingLeave(true);
            await requestLeaveGroup(groupId);
            setLeaveModalMember(null);
            await loadGroupData();
        } catch (err) {
            console.error("Failed to request leave:", err);
            alert(err.response?.data?.message || "Failed to submit leave request.");
        } finally {
            setRequestingLeave(false);
        }
    };

    const handleCancelLeaveRequest = async () => {
        try {
            setRequestingLeave(true);
            await cancelLeaveRequest(groupId);
            await loadGroupData();
        } catch (err) {
            console.error("Failed to cancel leave request:", err);
            alert(err.response?.data?.message || "Failed to cancel leave request.");
        } finally {
            setRequestingLeave(false);
        }
    };

    const handleApproveLeaveRequest = async (requestId) => {
        try {
            await approveLeaveRequest(groupId, requestId);
            await loadGroupData();
        } catch (err) {
            console.error("Failed to approve leave request:", err);
            alert(err.response?.data?.message || "Failed to approve leave request.");
        }
    };

    const handleRejectLeaveRequest = async (requestId) => {
        try {
            await rejectLeaveRequest(groupId, requestId);
            await loadGroupData();
        } catch (err) {
            console.error("Failed to reject leave request:", err);
            alert(err.response?.data?.message || "Failed to reject leave request.");
        }
    };

    const getUserBalance = (userId) => {
        const bObj = balances.find((item) => String(item.id) === String(userId));
        return bObj ? Number(bObj.balance) : 0;
    };


    // =========================
    // LOAD GROUP DATA
    // =========================

    const loadGroupData = async () => {

        try {

            setLoading(true);

            setError("");


            // Get all groups
            const groups = await getGroups();


            // Find current group
            const selectedGroup = groups.find(
                (item) =>
                    String(item.id) ===
                    String(groupId)
            );


            if (!selectedGroup) {

                setError("Group not found.");

                return;
            }


            setGroup(selectedGroup);


            // Get members,
            // balances, expenses and leave requests together
            const [
                membersData,
                balancesData,
                expensesData,
                leaveReqData,
            ] = await Promise.all([

                getGroupMembers(groupId),

                getGroupBalances(groupId),

                getGroupExpenses(groupId),

                getLeaveRequests(groupId).catch(() => ({ requests: [] })),

            ]);


            setMembers(membersData);

            setBalances(balancesData);

            setExpenses(expensesData);

            setLeaveRequests(leaveReqData?.requests || []);


        } catch (error) {

            console.error(
                "Failed to load group:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Unable to load group."
            );


        } finally {

            setLoading(false);

        }

    };



    // =========================
    // LOAD ON PAGE OPEN
    // =========================

    useEffect(() => {

        loadGroupData();

    }, [groupId]);


    // =========================
    // LOADING SCREEN
    // =========================

    if (loading) {

        return (

            <div className="app-shell">

                <Navbar />

                <div className="app-body">

                    <Sidebar />

                    <main className="dashboard">

                        <div className="empty-state">

                            <div className="loading-spinner" />

                            <p>
                                Loading group...
                            </p>

                        </div>

                    </main>

                </div>

            </div>

        );

    }


    // =========================
    // ERROR SCREEN
    // =========================

    if (error) {

        return (

            <div className="app-shell">

                <Navbar />

                <div className="app-body">

                    <Sidebar />

                    <main className="dashboard">

                        <button
                            className="secondary-button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >

                            <ArrowLeft size={17} />

                            Back to dashboard

                        </button>


                        <div className="dashboard-error">

                            {error}

                        </div>

                    </main>

                </div>

            </div>

        );

    }


    // =========================
    // MAIN PAGE
    // =========================

    return (

        <div className="app-shell">


            {/* =====================
                NAVBAR
            ====================== */}

            <Navbar />


            <div className="app-body">


                {/* =====================
                    SIDEBAR
                ====================== */}

                <Sidebar />


                {/* =====================
                    MAIN CONTENT
                ====================== */}

                <main className="dashboard">


                    {/* =====================
                        BACK BUTTON
                    ====================== */}

                    <button
                        className="back-button"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                    >

                        <ArrowLeft size={17} />

                        Back to dashboard

                    </button>


                    {/* =====================
                        GROUP HEADER
                    ====================== */}

                    <section className="group-header">


                        <div className="group-title-area">


                            <div className="large-group-icon">

                                <Users size={27} />

                            </div>


                            <div>

                                <p className="eyebrow">
                                    GROUP
                                </p>


                                <h1>
                                    {group?.name}
                                </h1>


                                <p>

                                    {members.length}

                                    {" "}

                                    {members.length === 1
                                        ? "member"
                                        : "members"}

                                </p>

                            </div>


                        </div>


                        <div className="group-header-actions">

                            {/* REFRESH */}

                            <button
                                className="secondary-button"
                                onClick={
                                    loadGroupData
                                }
                            >

                                <RefreshCw
                                    size={16}
                                />

                                Refresh

                            </button>


                            {/* ADD EXPENSE */}

                            <button
                                className="primary-action"
                                onClick={() =>
                                    setShowExpenseModal(
                                        true
                                    )
                                }
                            >

                                <Plus size={18} />

                                Add expense

                            </button>


                            {/* DELETE GROUP (ADMIN ONLY) */}

                            {isCreator && (
                                <button
                                    className="danger-outline-button"
                                    onClick={() => setShowDeleteGroupModal(true)}
                                    title="Delete group"
                                >
                                    <Trash2 size={16} />
                                    <span>Delete group</span>
                                </button>
                            )}

                        </div>


                    </section>


                    {/* =====================
                        BALANCES
                    ====================== */}

                    <section className="dashboard-section">


                        <div className="section-header">

                            <div>

                                <h2>
                                    Group balances
                                </h2>

                                <p>
                                    See who has paid
                                    and who currently
                                    owes money.
                                </p>

                            </div>

                        </div>


                        {balances.length === 0 ? (

                            <div className="empty-state">

                                <Wallet size={30} />

                                <h3>
                                    No balances yet
                                </h3>

                                <p>
                                    Add an expense
                                    to start
                                    calculating
                                    balances.
                                </p>

                            </div>

                        ) : (

                            <div className="balance-list">


                                {balances.map(
                                    (member) => {

                                        const balance =
                                            Number(
                                                member.balance
                                            );


                                        return (

                                            <div
                                                className="balance-row"
                                                key={
                                                    member.id
                                                }
                                            >


                                                <div className="member-info">


                                                    <div className="member-avatar">

                                                        {member.name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            ?.toUpperCase()}

                                                    </div>


                                                    <div>

                                                        <strong>
                                                            {
                                                                member.name
                                                            }
                                                        </strong>


                                                        <span>

                                                            Paid ₹

                                                            {Number(
                                                                member.total_paid
                                                            ).toFixed(
                                                                2
                                                            )}

                                                        </span>

                                                    </div>


                                                </div>


                                                <div
                                                    className={
                                                        balance >
                                                            0
                                                            ? "balance-positive"
                                                            : balance <
                                                                0
                                                                ? "balance-negative"
                                                                : "balance-zero"
                                                    }
                                                >

                                                    {balance >
                                                        0
                                                        ? "+"
                                                        : ""}

                                                    ₹

                                                    {balance.toFixed(
                                                        2
                                                    )}

                                                </div>


                                            </div>

                                        );

                                    }
                                )}


                            </div>

                        )}


                    </section>


                    {/* =====================
                        PENDING LEAVE REQUESTS (CREATOR ONLY)
                    ====================== */}

                    {isCreator && leaveRequests.length > 0 && (
                        <section className="dashboard-section leave-requests-section">
                            <div className="section-header">
                                <div>
                                    <div className="title-with-badge">
                                        <h2>Pending Leave Requests</h2>
                                        <span className="count-badge danger">{leaveRequests.length}</span>
                                    </div>
                                    <p>Members requesting permission to exit this group. Review their balances before approving.</p>
                                </div>
                            </div>

                            <div className="leave-requests-grid">
                                {leaveRequests.map((request) => {
                                    const requesterBalanceObj = balances.find(b => String(b.id) === String(request.user_id));
                                    const requesterBalance = requesterBalanceObj ? Number(requesterBalanceObj.balance) : 0;
                                    const owesMoney = requesterBalance < 0;

                                    return (
                                        <div className="leave-request-card" key={request.id}>
                                            <div className="leave-request-info">
                                                <div className="member-avatar large">
                                                    {request.user_name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div className="leave-request-details">
                                                    <div className="member-name-row">
                                                        <strong>{request.user_name}</strong>
                                                    </div>
                                                    <span className="member-email">{request.user_email}</span>
                                                    <div className="request-time">
                                                        Requested on {new Date(request.requested_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="leave-request-right">
                                                <div className="leave-request-balance">
                                                    <span className="balance-lbl">Group Balance:</span>
                                                    <strong className={owesMoney ? "balance-negative" : requesterBalance > 0 ? "balance-positive" : "balance-zero"}>
                                                        {owesMoney ? `Owes ₹${Math.abs(requesterBalance).toFixed(2)}` : requesterBalance > 0 ? `Gets ₹${requesterBalance.toFixed(2)}` : "Settled ₹0.00"}
                                                    </strong>
                                                </div>

                                                {owesMoney && (
                                                    <div className="scam-warning-pill" title="This member owes money in the group!">
                                                        <AlertTriangle size={14} /> Owes Money
                                                    </div>
                                                )}

                                                <div className="leave-request-actions">
                                                    <button
                                                        className="action-btn approve"
                                                        onClick={() => handleApproveLeaveRequest(request.id)}
                                                        title="Approve & remove member from group"
                                                    >
                                                        <CheckCircle size={16} />
                                                        <span>Approve Leave</span>
                                                    </button>
                                                    <button
                                                        className="action-btn reject"
                                                        onClick={() => handleRejectLeaveRequest(request.id)}
                                                        title="Reject leave request"
                                                    >
                                                        <XCircle size={16} />
                                                        <span>Reject</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}


                    {/* =====================
                        MEMBERS
                    ====================== */}

                    <section className="dashboard-section">


                        <div className="section-header">


                            <div>

                                <h2>
                                    Members
                                </h2>

                                <p>
                                    People participating
                                    in this group.
                                </p>

                            </div>

                            <button
                                className="primary-button"
                                onClick={() =>
                                    setShowAddMemberModal(true)
                                }
                            >

                                <Plus size={17} />

                                Add member

                            </button>


                        </div>


                        <div className="members-grid">
                            {members.map((member) => {
                                const isMemberCreator = String(member.id) === String(group?.created_by);
                                const isSelf = String(member.id) === String(user?.id);
                                const memberLeaveReq = leaveRequests.find(r => String(r.user_id) === String(member.id));
                                const canRemove = isCreator && !isMemberCreator;
                                const canLeave = isSelf && !isMemberCreator;

                                return (
                                    <div className="member-card" key={member.id}>
                                        <div className="member-card-left">
                                            <div className="member-avatar large">
                                                {member.name?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="member-details">
                                                <div className="member-name-row">
                                                    <strong>{member.name}</strong>
                                                    {isMemberCreator && (
                                                        <span className="role-badge creator" title="Group Creator">
                                                            <Crown size={12} /> Admin
                                                        </span>
                                                    )}
                                                    {isSelf && (
                                                        <span className="role-badge self" title="It's You">
                                                            You
                                                        </span>
                                                    )}
                                                    {memberLeaveReq && (
                                                        <span className="role-badge pending-leave" title="Leave Request Pending Admin Approval">
                                                            <Clock size={12} /> Leave Requested
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="member-email">{member.email}</span>
                                            </div>
                                        </div>

                                        <div className="member-card-actions">
                                            {canRemove && (
                                                <button
                                                    className="member-action-btn remove"
                                                    onClick={() => setMemberToExit(member)}
                                                    title="Remove member from group"
                                                >
                                                    <UserX size={15} />
                                                    <span>Remove</span>
                                                </button>
                                            )}
                                            {canLeave && (
                                                memberLeaveReq ? (
                                                    <button
                                                        className="member-action-btn cancel-leave"
                                                        onClick={handleCancelLeaveRequest}
                                                        title="Cancel your pending leave request"
                                                        disabled={requestingLeave}
                                                    >
                                                        <XCircle size={15} />
                                                        <span>Cancel Request</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="member-action-btn leave"
                                                        onClick={() => setLeaveModalMember(member)}
                                                        title="Request permission to leave group"
                                                    >
                                                        <LogOut size={15} />
                                                        <span>Request to Leave</span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                    </section>


                    {/* =====================
                        EXPENSES
                    ====================== */}

                    <section
                        className="dashboard-section"
                        id="expenses"
                    >


                        <div className="section-header">


                            <div>

                                <h2>
                                    Expenses
                                </h2>

                                <p>
                                    Shared expenses
                                    for this group.
                                </p>

                            </div>


                            {/* ADD EXPENSE */}

                            <button
                                className="primary-action"
                                onClick={() =>
                                    setShowExpenseModal(
                                        true
                                    )
                                }
                            >

                                <Plus size={17} />

                                Add expense

                            </button>


                        </div>


                        {/* =====================
                            NO EXPENSES
                        ====================== */}

                        {expenses.length === 0 ? (

                            <div className="empty-state">

                                <Wallet size={30} />

                                <h3>
                                    No expenses yet
                                </h3>

                                <p>
                                    Add your first
                                    expense to start
                                    splitting costs.
                                </p>

                            </div>

                        ) : (

                            /* =====================
                               EXPENSE LIST
                            ====================== */

                            <div className="expense-list">


                                {expenses.map(
                                    (expense) => (

                                        <div
                                            className="expense-row clickable-expense"
                                            key={expense.id}
                                            onClick={() =>
                                                setSelectedExpense(expense)
                                            }
                                        >


                                            <div className="expense-main">


                                                <div className="expense-icon">

                                                    <Receipt
                                                        size={18}
                                                    />

                                                </div>


                                                <div>

                                                    <strong>
                                                        {
                                                            expense.description
                                                        }
                                                    </strong>


                                                    <span>
                                                        {new Date(expense.date).toLocaleDateString(
                                                            "en-IN",
                                                            {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric",
                                                            }
                                                        )}
                                                    </span>

                                                </div>


                                            </div>


                                            <strong className="expense-amount">

                                                ₹

                                                {Number(
                                                    expense.amount
                                                ).toFixed(
                                                    2
                                                )}

                                            </strong>


                                        </div>

                                    )
                                )}


                            </div>

                        )}


                    </section>


                </main>


            </div>


            {/* =====================
                ADD EXPENSE MODAL
            ====================== */}

            {showExpenseModal && (

                <AddExpenseModal

                    groupId={groupId}

                    members={members}

                    onClose={() =>
                        setShowExpenseModal(
                            false
                        )
                    }

                    onSuccess={() => {

                        loadGroupData();

                    }}

                />

            )}

            {selectedExpense && (
                <ExpenseDetailsModal
                    expense={selectedExpense}
                    onClose={() =>
                        setSelectedExpense(null)
                    }
                    onDeleted={() => {
                        loadGroupData();
                    }}
                />
            )}

            {showAddMemberModal && (
                <AddMemberModal
                    groupId={groupId}
                    onClose={() => setShowAddMemberModal(false)}
                    onSuccess={() => {
                        loadGroupData();
                    }}
                />
            )}

            {memberToExit && (
                <div className="modal-overlay">
                    <div className="modal-card confirm-modal">
                        <div className="modal-header">
                            <h3>
                                Remove Member?
                            </h3>
                        </div>
                        <div className="confirm-modal-body">
                            <AlertTriangle size={36} className="warning-icon" />
                            <p>
                                Are you sure you want to remove <strong>{memberToExit.name}</strong> from "{group?.name}"?
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() => setMemberToExit(null)}
                                disabled={exitingMember}
                            >
                                Cancel
                            </button>
                            <button
                                className="danger-button"
                                onClick={handleRemoveMemberConfirm}
                                disabled={exitingMember}
                            >
                                {exitingMember ? "Processing..." : "Remove Member"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REQUEST TO LEAVE MODAL */}
            {leaveModalMember && (
                <div className="modal-overlay">
                    <div className="modal-card confirm-modal">
                        <div className="modal-header">
                            <h3>Request to Leave Group?</h3>
                        </div>
                        <div className="confirm-modal-body">
                            <ShieldAlert size={40} style={{ color: '#f59e0b' }} />
                            <p>
                                To prevent scams and unsettled expenses, members must request approval from the group creator to exit.
                            </p>
                            <div className="leave-balance-info">
                                <span>Your Current Group Balance:</span>
                                <strong className={
                                    getUserBalance(user?.id) > 0 ? "balance-positive" : 
                                    getUserBalance(user?.id) < 0 ? "balance-negative" : "balance-zero"
                                }>
                                    {getUserBalance(user?.id) > 0 ? `+₹${getUserBalance(user?.id).toFixed(2)} (Gets money)` :
                                     getUserBalance(user?.id) < 0 ? `-₹${Math.abs(getUserBalance(user?.id)).toFixed(2)} (Owes money)` :
                                     "₹0.00 (Settled)"}
                                </strong>
                            </div>
                            {getUserBalance(user?.id) < 0 && (
                                <div className="warning-callout">
                                    <AlertTriangle size={16} />
                                    <span>You currently owe money in this group! The group admin may ask you to settle your balance before approving.</span>
                                </div>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() => setLeaveModalMember(null)}
                                disabled={requestingLeave}
                            >
                                Cancel
                            </button>
                            <button
                                className="primary-button"
                                onClick={handleRequestLeaveSubmit}
                                disabled={requestingLeave}
                            >
                                {requestingLeave ? "Submitting..." : "Send Leave Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE GROUP MODAL */}

            {showDeleteGroupModal && (
                <div className="modal-overlay">
                    <div className="modal-card confirm-modal">
                        <div className="modal-header">
                            <h3>Delete Group?</h3>
                        </div>
                        <div className="confirm-modal-body">
                            <AlertTriangle size={42} className="warning-icon" />
                            <p>
                                Are you sure you want to delete <strong>"{group?.name}"</strong>? This will permanently delete all associated expenses, balances, settlements, and group data. This action cannot be undone.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() => setShowDeleteGroupModal(false)}
                                disabled={deletingGroup}
                            >
                                Cancel
                            </button>
                            <button
                                className="danger-button"
                                onClick={handleDeleteGroupConfirm}
                                disabled={deletingGroup}
                            >
                                {deletingGroup ? "Deleting..." : "Yes, Delete Group"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );

};


export default GroupDetails;