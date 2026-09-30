import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isTokenExpired } from "../api/api";

const ProtectedRoute = ({ children }) => {
    const { user, loading, logout } = useAuth();
    const token = localStorage.getItem("token");

    if (loading) {
        return (
            <div className="empty-state" style={{ minHeight: "100vh" }}>
                <div className="loading-spinner" />
                <p>Verifying authentication...</p>
            </div>
        );
    }

    if (!user || !token || isTokenExpired(token)) {
        if (user || token) {
            logout();
        }
        return <Navigate to="/login?reason=expired" replace />;
    }

    return children;
};

export default ProtectedRoute;