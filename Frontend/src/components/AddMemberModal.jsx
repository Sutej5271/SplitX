import { useState } from "react";

import {
    X,
    UserPlus,
    User,
} from "lucide-react";

import { addGroupMember } from "../api/groupApi";


const AddMemberModal = ({
    groupId,
    onClose,
    onSuccess,
}) => {
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!identifier.trim()) {
            setError("Please enter a username or email.");
            return;
        }

        try {
            setLoading(true);
            await addGroupMember(groupId, identifier.trim());
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to add member:", error);
            setError(
                error.response?.data?.message ||
                "Failed to add member."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="modal-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="add-member-modal">
                {/* HEADER */}
                <div className="modal-header">
                    <div className="expense-details-title">
                        <div className="modal-icon">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h2>Add member</h2>
                            <p>Add someone to this group by username or email.</p>
                        </div>
                    </div>

                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* FORM */}
                <form className="add-member-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="identifier">Username or Email</label>
                        <input
                            id="identifier"
                            type="text"
                            placeholder="e.g. Balaram or balaram@gmail.com"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            autoFocus
                        />
                        <span className="field-hint">
                            Enter the member's username or email address.
                        </span>
                    </div>


                    {error && (

                        <div className="form-error">
                            {error}
                        </div>

                    )}


                    {/* FOOTER */}

                    <div className="add-member-footer">

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
                            className="primary-button"
                            disabled={loading}
                        >

                            <UserPlus size={17} />

                            {loading
                                ? "Adding..."
                                : "Add member"}

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

};


export default AddMemberModal;