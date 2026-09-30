import { LogOut, WalletCards, Settings } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="topbar">
            <Link to="/dashboard" className="topbar-brand" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="topbar-logo">
                    <WalletCards size={21} />
                </div>
                <span>SplitX</span>
            </Link>

            <div className="topbar-right">
                <Link to="/profile" className="user-info user-info-clickable" title="Profile & Settings">
                    {user?.avatarImage ? (
                        <img src={user.avatarImage} alt="Avatar" className="user-avatar-img" />
                    ) : (
                        <div
                            className="user-avatar"
                            style={user?.avatarBg ? { backgroundColor: user.avatarBg, color: "#ffffff" } : {}}
                        >
                            {user?.avatarEmoji || user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                    )}

                    <div className="user-details">
                        <strong>{user?.name || "User"}</strong>
                        <span>{user?.email}</span>
                    </div>
                </Link>

                <button
                    className="logout-button"
                    onClick={() => navigate("/profile")}
                    title="Settings"
                >
                    <Settings size={18} />
                </button>

                <button
                    className="logout-button"
                    onClick={logout}
                    title="Logout"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export default Navbar;