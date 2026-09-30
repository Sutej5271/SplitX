import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    RefreshCw,
    Plus,
    Repeat,
    Trash2,
    Pencil,
    X,
    CalendarDays,
    IndianRupee,
    User,
    AlertCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import {
    getRecurringExpenses,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
} from "../api/recurringApi";

import { getGroupMembers } from "../api/groupApi";


function Recurring() {

    const { groupId } = useParams();
    const navigate = useNavigate();


    // ==========================================
    // STATE
    // ==========================================

    const [recurringExpenses, setRecurringExpenses] = useState([]);
    const [members, setMembers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // Modal
    const [showModal, setShowModal] = useState(false);

    // Edit mode
    const [editingExpense, setEditingExpense] = useState(null);


    // Form
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [paidBy, setPaidBy] = useState("");
    const [frequency, setFrequency] = useState("monthly");
    const [nextDueDate, setNextDueDate] = useState("");


    // ==========================================
    // LOAD DATA
    // ==========================================

    const loadData = async () => {

        try {

            setLoading(true);
            setError("");

            const [recurringData, membersData] =
                await Promise.all([
                    getRecurringExpenses(groupId),
                    getGroupMembers(groupId),
                ]);


            // Recurring API returns:
            // {
            //   groupId,
            //   recurring_expenses: [...]
            // }

            setRecurringExpenses(
                Array.isArray(recurringData)
                    ? recurringData
                    : recurringData?.recurring_expenses || []
            );


            // Members API can return either
            // an array or { members: [...] }

            setMembers(
                Array.isArray(membersData)
                    ? membersData
                    : membersData?.members || []
            );

        } catch (err) {

            console.error(
                "Failed to load recurring expenses:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to load recurring expenses."
            );

        } finally {

            setLoading(false);

        }
    };


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        if (groupId) {
            loadData();
        }

    }, [groupId]);


    // ==========================================
    // OPEN CREATE MODAL
    // ==========================================

    const openCreateModal = () => {

        setEditingExpense(null);

        setDescription("");
        setAmount("");
        setPaidBy(
            members.length > 0
                ? String(members[0].id)
                : ""
        );
        setFrequency("monthly");

        // Default date = today
        const today = new Date();

        const formattedDate =
            today.toISOString().split("T")[0];

        setNextDueDate(formattedDate);

        setError("");
        setSuccess("");

        setShowModal(true);
    };


    // ==========================================
    // OPEN EDIT MODAL
    // ==========================================

    const openEditModal = (expense) => {

        setEditingExpense(expense);

        setDescription(
            expense.description || ""
        );

        setAmount(
            expense.amount || ""
        );

        setPaidBy(
            expense.paid_by
                ? String(expense.paid_by)
                : ""
        );

        setFrequency(
            expense.frequency || "monthly"
        );

        setNextDueDate(
            expense.next_due_date
                ? String(expense.next_due_date).split("T")[0]
                : ""
        );

        setError("");
        setSuccess("");

        setShowModal(true);
    };


    // ==========================================
    // CLOSE MODAL
    // ==========================================

    const closeModal = () => {

        if (saving) return;

        setShowModal(false);
        setEditingExpense(null);

    };


    // ==========================================
    // SAVE RECURRING EXPENSE
    // ==========================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");


        // Basic validation

        if (!description.trim()) {

            setError(
                "Please enter a description."
            );

            return;
        }


        if (!amount || Number(amount) <= 0) {

            setError(
                "Amount must be greater than 0."
            );

            return;
        }


        if (!paidBy) {

            setError(
                "Please select who paid."
            );

            return;
        }


        if (!nextDueDate) {

            setError(
                "Please select the next due date."
            );

            return;
        }


        try {

            setSaving(true);


            const payload = {
                group_id: Number(groupId),
                description: description.trim(),
                amount: Number(amount),
                paid_by: Number(paidBy),
                frequency,
                next_due_date: nextDueDate,
            };


            // EDIT

            if (editingExpense) {

                await updateRecurringExpense(
                    editingExpense.id,
                    payload
                );

                setSuccess(
                    "Recurring expense updated successfully."
                );

            }

            // CREATE

            else {

                await createRecurringExpense(
                    payload
                );

                setSuccess(
                    "Recurring expense created successfully."
                );

            }


            await loadData();


            setTimeout(() => {

                setShowModal(false);
                setEditingExpense(null);
                setSuccess("");

            }, 700);


        } catch (err) {

            console.error(
                "Failed to save recurring expense:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to save recurring expense."
            );

        } finally {

            setSaving(false);

        }
    };


    // ==========================================
    // DELETE
    // ==========================================

    const handleDelete = async (expense) => {

        const confirmed = window.confirm(
            `Delete "${expense.description}"?`
        );

        if (!confirmed) return;


        try {

            setError("");

            await deleteRecurringExpense(
                expense.id
            );

            await loadData();

            setSuccess(
                "Recurring expense deleted successfully."
            );

            setTimeout(() => {
                setSuccess("");
            }, 2000);

        } catch (err) {

            console.error(
                "Failed to delete recurring expense:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Failed to delete recurring expense."
            );
        }
    };


    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {

        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    // ==========================================
    // FORMAT FREQUENCY
    // ==========================================

    const formatFrequency = (value) => {

        if (!value) return "-";

        return (
            value.charAt(0).toUpperCase() +
            value.slice(1)
        );
    };


    // ==========================================
    // FIND MEMBER NAME
    // ==========================================

    const getMemberName = (userId) => {

        const member = members.find(
            (item) =>
                Number(item.id) === Number(userId) ||
                Number(item.user_id) === Number(userId)
        );

        if (!member) {
            return `User #${userId}`;
        }

        return (
            member.name ||
            member.user_name ||
            member.full_name ||
            `User #${userId}`
        );
    };


    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="app-shell">

            <Navbar />

            <div className="app-body">

                <Sidebar />

                <main className="dashboard">

                {/* ============================= */}
                {/* HEADER */}
                {/* ============================= */}

                <div className="page-header">

                    <div>

                        <button
                            className="back-button"
                            onClick={() =>
                                navigate(
                                    `/groups/${groupId}`
                                )
                            }
                        >
                            <ArrowLeft size={18} />

                            Back to group
                        </button>


                        <div className="page-title-row">

                            <div className="page-icon">
                                <Repeat size={24} />
                            </div>

                            <div>

                                <h1>
                                    Recurring expenses
                                </h1>

                                <p>
                                    Automatically manage
                                    repeated group expenses.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div className="page-actions">

                        <button
                            className="secondary-button"
                            onClick={loadData}
                            disabled={loading}
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    loading
                                        ? "spin"
                                        : ""
                                }
                            />

                            Refresh
                        </button>


                        <button
                            className="primary-button"
                            onClick={openCreateModal}
                        >
                            <Plus size={18} />

                            Add recurring expense
                        </button>

                    </div>

                </div>


                {/* ============================= */}
                {/* SUCCESS */}
                {/* ============================= */}

                {success && (

                    <div className="success-message">

                        {success}

                    </div>

                )}


                {/* ============================= */}
                {/* ERROR */}
                {/* ============================= */}

                {error && !showModal && (

                    <div className="error-message">

                        <AlertCircle size={18} />

                        {error}

                    </div>

                )}


                {/* ============================= */}
                {/* CONTENT */}
                {/* ============================= */}

                {loading ? (

                    <div className="empty-card">

                        <RefreshCw
                            size={28}
                            className="spin"
                        />

                        <p>
                            Loading recurring expenses...
                        </p>

                    </div>

                ) : recurringExpenses.length === 0 ? (

                    <div className="empty-card">

                        <div className="empty-icon">

                            <Repeat size={28} />

                        </div>

                        <h2>
                            No recurring expenses
                        </h2>

                        <p>
                            Add rent, subscriptions,
                            memberships, or any other
                            repeated expense.
                        </p>

                        <button
                            className="primary-button"
                            onClick={openCreateModal}
                        >
                            <Plus size={18} />

                            Add recurring expense
                        </button>

                    </div>

                ) : (

                    <div className="recurring-list">

                        {recurringExpenses.map(
                            (expense) => (

                                <div
                                    className="recurring-card"
                                    key={expense.id}
                                >

                                    <div className="recurring-icon">

                                        <Repeat size={21} />

                                    </div>


                                    <div className="recurring-info">

                                        <h3>
                                            {expense.description}
                                        </h3>

                                        <div className="recurring-meta">

                                            <span>
                                                <IndianRupee
                                                    size={14}
                                                />

                                                {Number(
                                                    expense.amount
                                                ).toFixed(2)}
                                            </span>


                                            <span>
                                                <CalendarDays
                                                    size={14}
                                                />

                                                Next:
                                                {" "}
                                                {formatDate(
                                                    expense.next_due_date
                                                )}
                                            </span>


                                            <span>
                                                {formatFrequency(
                                                    expense.frequency
                                                )}
                                            </span>


                                            <span>
                                                <User
                                                    size={14}
                                                />

                                                Paid by:
                                                {" "}
                                                {expense.paid_by_name ||
                                                    getMemberName(
                                                        expense.paid_by
                                                    )}
                                            </span>

                                        </div>

                                    </div>


                                    <div className="recurring-actions">

                                        <button
                                            className="icon-button"
                                            title="Edit"
                                            onClick={() =>
                                                openEditModal(
                                                    expense
                                                )
                                            }
                                        >
                                            <Pencil
                                                size={17}
                                            />
                                        </button>


                                        <button
                                            className="icon-button danger"
                                            title="Delete"
                                            onClick={() =>
                                                handleDelete(
                                                    expense
                                                )
                                            }
                                        >
                                            <Trash2
                                                size={17}
                                            />
                                        </button>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </main>

        </div>


            {/* ================================== */}
            {/* MODAL */}
            {/* ================================== */}

            {showModal && (

                <div
                    className="modal-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target === e.currentTarget
                        ) {
                            closeModal();
                        }

                    }}
                >

                    <div className="modal-card">

                        <div className="modal-header">

                            <div>

                                <h2>

                                    {editingExpense
                                        ? "Edit recurring expense"
                                        : "Add recurring expense"}

                                </h2>

                                <p>
                                    Set up an expense that
                                    repeats automatically.
                                </p>

                            </div>


                            <button
                                className="modal-close"
                                onClick={closeModal}
                            >
                                <X size={20} />
                            </button>

                        </div>


                        {/* ERROR */}

                        {error && (

                            <div className="error-message modal-error">

                                <AlertCircle size={17} />

                                {error}

                            </div>

                        )}


                        <form
                            onSubmit={handleSubmit}
                            className="recurring-form"
                        >

                            {/* DESCRIPTION */}

                            <div className="form-group">

                                <label>
                                    Description
                                </label>

                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(
                                            e.target.value
                                        )
                                    }
                                    placeholder="e.g. Hostel rent"
                                    disabled={saving}
                                />

                            </div>


                            {/* AMOUNT */}

                            <div className="form-group">

                                <label>
                                    Amount
                                </label>

                                <div className="input-with-icon">

                                    <IndianRupee
                                        size={17}
                                    />

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(
                                                e.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        disabled={saving}
                                    />

                                </div>

                            </div>


                            {/* PAID BY */}

                            <div className="form-group">

                                <label>
                                    Paid by
                                </label>

                                <select
                                    value={paidBy}
                                    onChange={(e) =>
                                        setPaidBy(
                                            e.target.value
                                        )
                                    }
                                    disabled={saving}
                                >

                                    <option value="">
                                        Select member
                                    </option>

                                    {members.map(
                                        (member) => {

                                            const id =
                                                member.id ??
                                                member.user_id;

                                            return (

                                                <option
                                                    key={id}
                                                    value={id}
                                                >
                                                    {member.name ||
                                                        member.user_name ||
                                                        member.full_name ||
                                                        `User #${id}`}
                                                </option>

                                            );

                                        }
                                    )}

                                </select>

                            </div>


                            {/* FREQUENCY */}

                            <div className="form-group">

                                <label>
                                    Frequency
                                </label>

                                <select
                                    value={frequency}
                                    onChange={(e) =>
                                        setFrequency(
                                            e.target.value
                                        )
                                    }
                                    disabled={saving}
                                >

                                    <option value="daily">
                                        Daily
                                    </option>

                                    <option value="weekly">
                                        Weekly
                                    </option>

                                    <option value="monthly">
                                        Monthly
                                    </option>

                                    <option value="yearly">
                                        Yearly
                                    </option>

                                </select>

                            </div>


                            {/* NEXT DUE DATE */}

                            <div className="form-group">

                                <label>
                                    Next due date
                                </label>

                                <input
                                    type="date"
                                    value={nextDueDate}
                                    onChange={(e) =>
                                        setNextDueDate(
                                            e.target.value
                                        )
                                    }
                                    disabled={saving}
                                />

                            </div>


                            {/* ACTIONS */}

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving}
                                >

                                    {saving ? (
                                        <>
                                            <RefreshCw
                                                size={17}
                                                className="spin"
                                            />

                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {editingExpense
                                                ? "Save changes"
                                                : "Add recurring expense"}
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Recurring;