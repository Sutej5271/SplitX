import { useEffect, useState } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Receipt,
    ArrowLeftRight,
    Repeat,
    Settings,
    Plus,
    FolderKanban,
} from "lucide-react";
import { getGroups } from "../api/groupApi";

const Sidebar = () => {
    const { groupId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGroups = async () => {
            try {
                const data = await getGroups();
                setGroups(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to load groups in sidebar:", error);
            } finally {
                setLoading(false);
            }
        };

        loadGroups();
    }, [groupId]);

    const isDashboard = location.pathname === "/dashboard";
    const isSettlements = location.pathname.includes("/settlements");
    const isRecurring = location.pathname.includes("/recurring");
    const isExpenses = location.hash === "#expenses";
    const isGroupOverview = Boolean(groupId) && !isSettlements && !isRecurring && !isExpenses;

    // Current group object if on a group page
    const currentGroup = groups.find((g) => String(g.id) === String(groupId));

    const handleExpensesClick = (e) => {
        if (groupId) {
            if (location.pathname === `/groups/${groupId}`) {
                // Already on group details page, smooth scroll to expenses
                const el = document.getElementById("expenses");
                if (el) {
                    e.preventDefault();
                    window.history.pushState(null, "", `/groups/${groupId}#expenses`);
                    el.scrollIntoView({ behavior: "smooth" });
                }
            }
        }
    };

    const handleOverviewClick = (e) => {
        if (groupId && location.pathname === `/groups/${groupId}`) {
            if (location.hash) {
                window.history.pushState(null, "", `/groups/${groupId}`);
            }
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {/* Dashboard Link (Main Navigation) */}
                <Link
                    to="/dashboard"
                    className={`sidebar-link ${isDashboard ? "active" : ""}`}
                >
                    <LayoutDashboard size={19} />
                    <span>Dashboard</span>
                </Link>

                {/* ========================================================= */}
                {/* ACTIVE GROUP MENU (When inside a group) */}
                {/* ========================================================= */}
                {groupId && (
                    <div className="sidebar-group-card">
                        <div className="sidebar-group-card-header">
                            <div className="sidebar-group-avatar">
                                {currentGroup?.name?.charAt(0)?.toUpperCase() || "G"}
                            </div>
                            <div className="sidebar-group-card-info">
                                <span className="sidebar-group-card-eyebrow">ACTIVE GROUP</span>
                                <h4 className="sidebar-group-card-title truncate" title={currentGroup?.name}>
                                    {currentGroup ? currentGroup.name : `Group #${groupId}`}
                                </h4>
                            </div>
                        </div>

                        <div className="sidebar-group-menu">
                            {/* Group Overview */}
                            <Link
                                to={`/groups/${groupId}`}
                                onClick={handleOverviewClick}
                                className={`sidebar-link ${isGroupOverview ? "active" : ""}`}
                            >
                                <Users size={18} />
                                <span>Overview</span>
                            </Link>

                            {/* Group Expenses */}
                            <Link
                                to={`/groups/${groupId}#expenses`}
                                onClick={handleExpensesClick}
                                className={`sidebar-link ${isExpenses ? "active" : ""}`}
                            >
                                <Receipt size={18} />
                                <span>Expenses</span>
                            </Link>

                            {/* Group Settlements */}
                            <Link
                                to={`/groups/${groupId}/settlements`}
                                className={`sidebar-link ${isSettlements ? "active" : ""}`}
                            >
                                <ArrowLeftRight size={18} />
                                <span>Settlements</span>
                            </Link>

                            {/* Group Recurring Expenses */}
                            <Link
                                to={`/groups/${groupId}/recurring`}
                                className={`sidebar-link ${isRecurring ? "active" : ""}`}
                            >
                                <Repeat size={18} />
                                <span>Recurring</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* ALL GROUPS LIST (Always available for easy switching) */}
                {/* ========================================================= */}
                <div className="sidebar-section-header">
                    <span className="sidebar-section-title">
                        YOUR GROUPS
                        {groups.length > 0 && <span className="sidebar-count-badge">{groups.length}</span>}
                    </span>
                </div>

                <div className="sidebar-group-list">
                    {groups.length > 0 ? (
                        groups.map((g) => {
                            const isSelected = String(g.id) === String(groupId);
                            return (
                                <Link
                                    key={g.id}
                                    to={`/groups/${g.id}`}
                                    className={`sidebar-sublink ${isSelected ? "active" : ""}`}
                                    title={g.name}
                                >
                                    <div className="sidebar-group-icon-dot">
                                        {g.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate">{g.name}</span>
                                </Link>
                            );
                        })
                    ) : !loading ? (
                        <div className="sidebar-empty-groups">
                            <span>No groups found</span>
                            <Link to="/dashboard" className="sidebar-create-link">
                                <Plus size={14} /> Create one
                            </Link>
                        </div>
                    ) : null}
                </div>

                {/* ACCOUNT SECTION */}
                <div className="sidebar-section-header">
                    <span className="sidebar-section-title">ACCOUNT</span>
                </div>
                <Link
                    to="/profile"
                    className={`sidebar-link ${location.pathname === "/profile" ? "active" : ""}`}
                >
                    <Settings size={19} />
                    <span>Profile & Settings</span>
                </Link>
            </nav>
        </aside>
    );
};

export default Sidebar;