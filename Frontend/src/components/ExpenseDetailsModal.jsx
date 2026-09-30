import { useEffect, useState } from "react";

import {
    X,
    Receipt,
    Trash2,
    Users,
    CalendarDays,
} from "lucide-react";

import {
    getExpenseSplit,
    deleteExpense,
} from "../api/expenseApi";


const ExpenseDetailsModal = ({
    expense,
    onClose,
    onDeleted,
}) => {

    const [splits, setSplits] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [deleting, setDeleting] =
        useState(false);

    const [error, setError] =
        useState("");


    // =========================
    // LOAD SPLIT
    // =========================

    useEffect(() => {

        const loadSplit = async () => {

            try {

                setLoading(true);

                setError("");

                const data =
                    await getExpenseSplit(
                        expense.id
                    );

                setSplits(data);

            } catch (error) {

                console.error(
                    "Failed to load expense split:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load expense split."
                );

            } finally {

                setLoading(false);

            }

        };


        loadSplit();

    }, [expense.id]);


    // =========================
    // DELETE
    // =========================

    const handleDelete = async () => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this expense?"
        );


        if (!confirmed) {
            return;
        }


        try {

            setDeleting(true);

            setError("");

            await deleteExpense(
                expense.id
            );

            onDeleted();

            onClose();

        } catch (error) {

            console.error(
                "Failed to delete expense:",
                error
            );

            setError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Unable to delete expense."
            );

        } finally {

            setDeleting(false);

        }

    };


    return (

        <div
            className="modal-overlay"
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }

            }}
        >

            <div className="expense-details-modal">


                {/* =====================
                    HEADER
                ====================== */}

                <div className="modal-header">

                    <div className="expense-details-title">

                        <div className="modal-icon">
                            <Receipt size={20} />
                        </div>

                        <div>

                            <h2>
                                {expense.description}
                            </h2>

                            <p>
                                Expense details
                            </p>

                        </div>

                    </div>


                    <button
                        className="modal-close"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>

                </div>


                {/* =====================
                    EXPENSE SUMMARY
                ====================== */}

                <div className="expense-summary">

                    <div className="expense-summary-item">

                        <span>
                            Total amount
                        </span>

                        <strong>
                            ₹
                            {Number(
                                expense.amount
                            ).toFixed(2)}
                        </strong>

                    </div>


                    <div className="expense-summary-item">

                        <span>
                            Date
                        </span>

                        <strong>

                            {new Date(
                                expense.date
                            ).toLocaleDateString(
                                "en-IN",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                }
                            )}

                        </strong>

                    </div>

                </div>


                {/* =====================
                    SPLIT
                ====================== */}

                <div className="split-section">

                    <div className="split-section-header">

                        <div>

                            <h3>
                                Split breakdown
                            </h3>

                            <p>
                                How this expense is
                                divided.
                            </p>

                        </div>

                        <Users size={19} />

                    </div>


                    {loading ? (

                        <div className="split-loading">

                            <div className="loading-spinner" />

                            <span>
                                Loading split...
                            </span>

                        </div>

                    ) : error ? (

                        <div className="form-error">
                            {error}
                        </div>

                    ) : splits.length === 0 ? (

                        <div className="split-empty">

                            <Users size={26} />

                            <p>
                                No split information
                                found.
                            </p>

                        </div>

                    ) : (

                        <div className="split-list">

                            {splits.map(
                                (split) => (

                                    <div
                                        className="split-row"
                                        key={
                                            split.id
                                        }
                                    >

                                        <div className="split-user">

                                            <div className="member-avatar">

                                                {split.name
                                                    ?.charAt(
                                                        0
                                                    )
                                                    ?.toUpperCase()}

                                            </div>

                                            <div>

                                                <strong>
                                                    {
                                                        split.name
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        split.email
                                                    }
                                                </span>

                                            </div>

                                        </div>


                                        <strong className="split-amount">

                                            ₹
                                            {Number(
                                                split.amount
                                            ).toFixed(
                                                2
                                            )}

                                        </strong>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>


                {/* =====================
                    ERROR
                ====================== */}

                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}


                {/* =====================
                    FOOTER
                ====================== */}

                <div className="expense-details-footer">

                    <button
                        className="delete-expense-button"
                        onClick={handleDelete}
                        disabled={
                            deleting ||
                            loading
                        }
                    >

                        <Trash2 size={17} />

                        {deleting
                            ? "Deleting..."
                            : "Delete expense"}

                    </button>


                    <button
                        className="secondary-button"
                        onClick={onClose}
                    >
                        Close
                    </button>

                </div>


            </div>

        </div>

    );

};


export default ExpenseDetailsModal;