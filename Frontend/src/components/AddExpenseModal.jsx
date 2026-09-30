import { useState } from "react";
import {
    X,
    Receipt,
    CalendarDays,
    Users,
} from "lucide-react";

import {
    createExpense,
    splitExpense,
} from "../api/expenseApi";

const AddExpenseModal = ({
    groupId,
    members,
    onClose,
    onSuccess,
}) => {
    const [description, setDescription] =
        useState("");

    const [amount, setAmount] =
        useState("");

    const [date, setDate] =
        useState(
            new Date().toISOString().split("T")[0]
        );

    const [selectedUsers, setSelectedUsers] =
        useState(
            members.map((member) => member.id)
        );

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const toggleUser = (userId) => {
        setSelectedUsers((current) => {
            if (current.includes(userId)) {
                return current.filter(
                    (id) => id !== userId
                );
            }

            return [...current, userId];
        });
    };

    const amountPerPerson =
        selectedUsers.length > 0 &&
        Number(amount) > 0
            ? Number(amount) /
              selectedUsers.length
            : 0;

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        if (!description.trim()) {
            setError(
                "Please enter an expense description."
            );
            return;
        }

        if (!amount || Number(amount) <= 0) {
            setError(
                "Please enter a valid amount."
            );
            return;
        }

        if (selectedUsers.length === 0) {
            setError(
                "Select at least one group member."
            );
            return;
        }

        try {
            setLoading(true);

            // 1. Create expense
            const expense =
                await createExpense({
                    group_id: Number(groupId),
                    description:
                        description.trim(),
                    amount: Number(amount),
                    date,
                });

            // 2. Split expense equally
            await splitExpense(
                expense.id,
                selectedUsers
            );

            // 3. Tell parent to refresh
            onSuccess();

            onClose();

        } catch (error) {
            console.error(
                "Failed to create expense:",
                error
            );

            setError(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Failed to create expense."
            );
        } finally {
            setLoading(false);
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

            <div className="expense-modal">

                {/* HEADER */}

                <div className="modal-header">

                    <div>
                        <div className="modal-icon">
                            <Receipt size={20} />
                        </div>

                        <div>
                            <h2>
                                Add expense
                            </h2>

                            <p>
                                Split an expense
                                with your group.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="expense-form"
                >

                    {/* ERROR */}

                    {error && (
                        <div className="form-error">
                            {error}
                        </div>
                    )}

                    {/* DESCRIPTION */}

                    <div className="form-group">

                        <label>
                            Description
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Dinner, movie tickets..."
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                    {/* AMOUNT */}

                    <div className="form-group">

                        <label>
                            Amount
                        </label>

                        <div className="amount-input">

                            <span>₹</span>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(event) =>
                                    setAmount(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                    {/* DATE */}

                    <div className="form-group">

                        <label>
                            Date
                        </label>

                        <div className="input-with-icon">

                            <CalendarDays
                                size={17}
                            />

                            <input
                                type="date"
                                value={date}
                                onChange={(event) =>
                                    setDate(
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                    {/* MEMBERS */}

                    <div className="form-group">

                        <div className="member-selection-header">

                            <label>
                                Split with
                            </label>

                            <span>
                                {selectedUsers.length}{" "}
                                selected
                            </span>

                        </div>

                        <div className="expense-members">

                            {members.map(
                                (member) => {

                                    const selected =
                                        selectedUsers.includes(
                                            member.id
                                        );

                                    return (
                                        <button
                                            type="button"
                                            key={
                                                member.id
                                            }
                                            className={
                                                selected
                                                    ? "expense-member selected"
                                                    : "expense-member"
                                            }
                                            onClick={() =>
                                                toggleUser(
                                                    member.id
                                                )
                                            }
                                        >

                                            <div className="member-avatar">
                                                {member.name
                                                    ?.charAt(
                                                        0
                                                    )
                                                    ?.toUpperCase()}
                                            </div>

                                            <div className="expense-member-info">

                                                <strong>
                                                    {
                                                        member.name
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        member.email
                                                    }
                                                </span>

                                            </div>

                                            <div
                                                className={
                                                    selected
                                                        ? "member-checkbox checked"
                                                        : "member-checkbox"
                                                }
                                            >
                                                {selected
                                                    ? "✓"
                                                    : ""}
                                            </div>

                                        </button>
                                    );
                                }
                            )}

                        </div>

                    </div>

                    {/* PREVIEW */}

                    <div className="split-preview">

                        <div>

                            <div className="preview-icon">
                                <Users size={17} />
                            </div>

                            <div>
                                <span>
                                    Each person pays
                                </span>

                                <strong>
                                    ₹
                                    {amountPerPerson.toFixed(
                                        2
                                    )}
                                </strong>
                            </div>

                        </div>

                        <small>
                            Equal split
                        </small>

                    </div>

                    {/* ACTIONS */}

                    <div className="modal-actions">

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="primary-action"
                            disabled={loading}
                        >
                            {loading
                                ? "Adding..."
                                : "Add expense"}
                        </button>

                    </div>

                </form>

            </div>
        </div>
    );
};

export default AddExpenseModal;