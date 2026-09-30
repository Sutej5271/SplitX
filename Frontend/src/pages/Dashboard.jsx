import { useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SummaryCard from "../components/SummaryCard";
import GroupCard from "../components/GroupCard";

import { useAuth } from "../context/AuthContext";
import { getGroups, createGroup, getDashboardSummary } from "../api/groupApi";

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return "Good morning";
    } else if (hour >= 12 && hour < 17) {
        return "Good afternoon";
    } else if (hour >= 17 && hour < 22) {
        return "Good evening";
    } else {
        return "Good night";
    }
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [summary, setSummary] = useState({
        youOwe: 0,
        youAreOwed: 0,
        netBalance: 0,
    });

    const [showCreateGroup, setShowCreateGroup] =
        useState(false);

    const [groupName, setGroupName] = useState("");
    const [creatingGroup, setCreatingGroup] =
        useState(false);

    const loadGroups = async () => {
        try {
            setError("");
            setLoading(true);

            const [groupsData, summaryData] = await Promise.all([
                getGroups(),
                getDashboardSummary().catch(() => null),
            ]);

            setGroups(groupsData || []);

            if (summaryData) {
                setSummary({
                    youOwe: summaryData.youOwe || 0,
                    youAreOwed: summaryData.youAreOwed || 0,
                    netBalance: summaryData.netBalance || 0,
                });
            }
        } catch (error) {
            console.error("Failed to load dashboard data:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load your groups."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGroups();
    }, []);

    const handleCreateGroup = async (event) => {
        event.preventDefault();

        const trimmedName = groupName.trim();

        if (!trimmedName) {
            return;
        }

        try {
            setCreatingGroup(true);
            setError("");

            await createGroup(trimmedName);

            setGroupName("");
            setShowCreateGroup(false);

            await loadGroups();
        } catch (error) {
            console.error("Failed to create group:", error);

            setError(
                error.response?.data?.message ||
                "Unable to create group."
            );
        } finally {
            setCreatingGroup(false);
        }
    };

    const handleGroupClick = (group) => {
        navigate(`/groups/${group.id}`);
    };

    return (
        <div className="app-shell">

            <Navbar />

            <div className="app-body">

                <Sidebar />

                <main className="dashboard">

                    <section className="dashboard-header">

                        <div>
                            <p className="eyebrow">
                                YOUR OVERVIEW
                            </p>

                            <h1>
                                {getGreeting()},{" "}
                                {user?.name?.split(" ")[0] || "there"} 👋
                            </h1>

                            <p className="dashboard-subtitle">
                                Keep track of your shared expenses
                                and group balances.
                            </p>
                        </div>

                        <button
                            className="primary-action"
                            onClick={() =>
                                setShowCreateGroup(true)
                            }
                        >
                            <Plus size={18} />
                            New group
                        </button>

                    </section>

                    {error && (
                        <div className="dashboard-error">
                            <span>{error}</span>

                            <button
                                onClick={loadGroups}
                                title="Retry"
                            >
                                <RefreshCw size={17} />
                            </button>
                        </div>
                    )}

                    <section className="summary-grid">

                        <SummaryCard
                            title="You owe"
                            amount={summary.youOwe}
                            description="Across your groups"
                            type="negative"
                            currency={user?.currency || "₹"}
                        />

                        <SummaryCard
                            title="You're owed"
                            amount={summary.youAreOwed}
                            description="Across your groups"
                            type="positive"
                            currency={user?.currency || "₹"}
                        />

                        <SummaryCard
                            title="Net balance"
                            amount={summary.netBalance}
                            description="Your overall position"
                            type={
                                summary.netBalance > 0
                                    ? "positive"
                                    : summary.netBalance < 0
                                    ? "negative"
                                    : "neutral"
                            }
                            currency={user?.currency || "₹"}
                        />

                    </section>

                    <section
                        className="dashboard-section"
                        id="groups"
                    >

                        <div className="section-header">

                            <div>
                                <h2>Your groups</h2>

                                <p>
                                    Groups where you currently
                                    participate.
                                </p>
                            </div>

                            <button
                                className="secondary-button"
                                onClick={loadGroups}
                                disabled={loading}
                            >
                                <RefreshCw
                                    size={16}
                                    className={
                                        loading
                                            ? "spin"
                                            : ""
                                    }
                                />

                                Refresh
                            </button>

                        </div>

                        {loading ? (
                            <div className="empty-state">
                                <div className="loading-spinner" />
                                <p>Loading your groups...</p>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="empty-state">

                                <div className="empty-icon">
                                    +
                                </div>

                                <h3>
                                    No groups yet
                                </h3>

                                <p>
                                    Create your first group to
                                    start splitting expenses.
                                </p>

                                <button
                                    className="primary-action"
                                    onClick={() =>
                                        setShowCreateGroup(true)
                                    }
                                >
                                    <Plus size={18} />
                                    Create your first group
                                </button>

                            </div>
                        ) : (
                            <div className="groups-grid">

                                {groups.map((group) => (
                                    <GroupCard
                                        key={group.id}
                                        group={group}
                                        onClick={handleGroupClick}
                                    />
                                ))}

                            </div>
                        )}

                    </section>

                </main>

            </div>

            {showCreateGroup && (
                <div
                    className="modal-backdrop"
                    onMouseDown={() =>
                        setShowCreateGroup(false)
                    }
                >
                    <div
                        className="modal"
                        onMouseDown={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="modal-header">
                            <div>
                                <h2>Create a group</h2>

                                <p>
                                    Start a new shared expense
                                    group.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowCreateGroup(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateGroup}>

                            <div className="form-group">
                                <label htmlFor="group-name">
                                    Group name
                                </label>

                                <input
                                    id="group-name"
                                    type="text"
                                    placeholder="e.g. Goa Trip"
                                    value={groupName}
                                    onChange={(event) =>
                                        setGroupName(
                                            event.target.value
                                        )
                                    }
                                    autoFocus
                                />
                            </div>

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                        setShowCreateGroup(false)
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-action"
                                    disabled={
                                        creatingGroup ||
                                        !groupName.trim()
                                    }
                                >
                                    {creatingGroup
                                        ? "Creating..."
                                        : "Create group"}
                                </button>

                            </div>

                        </form>

                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;