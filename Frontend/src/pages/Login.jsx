import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { WalletCards, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

import { loginUser } from "../api/authApi";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);

    useEffect(() => {
        if (location.search.includes("reason=expired")) {
            setSessionExpired(true);
        }
    }, [location.search]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!formData.email || !formData.password) {
            setError("Please enter your email and password.");
            return;
        }

        try {
            setLoading(true);
            const data = await loginUser(formData);
            login(data);
            navigate("/dashboard");
        } catch (error) {
            console.error(error);
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                `Login failed (${error.response?.status || "unknown error"})`;
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setLoading(true);
            setError("");
            const res = await api.post("/auth/google", {
                credential: credentialResponse.credential,
            });
            login(res.data);
            navigate("/dashboard");
        } catch (err) {
            console.error("Google login error:", err);
            setError(err.response?.data?.message || "Google authentication failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page green-theme">
            {/* Animated Floating Math & Calculator Signs */}
            <div className="math-badge float-1">+</div>
            <div className="math-badge float-2">−</div>
            <div className="math-badge float-3">×</div>
            <div className="math-badge float-4">÷</div>
            <div className="math-badge float-5">%</div>
            <div className="math-badge float-6">=</div>
            <div className="math-badge float-7">√</div>
            <div className="math-badge float-8">₹</div>
            <div className="math-badge float-9">50/50</div>

            <div className="auth-card">
                <div className="brand">
                    <div className="brand-icon">
                        <WalletCards size={28} />
                    </div>
                    <h1>SplitX</h1>
                    <p>Smart expense sharing made simple.</p>
                </div>

                <div className="auth-header">
                    <h2>Welcome back</h2>
                    <p>Login to manage your groups and expenses.</p>
                </div>

                {sessionExpired && !error && (
                    <div className="error-message" style={{ background: "#fff7ed", borderColor: "#ffedd5", color: "#c2410c", display: "flex", alignItem: "center", gap: "8px" }}>
                        <ShieldAlert size={18} />
                        <span>Session expired. Please log in again to continue.</span>
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="auth-divider" style={{ margin: "20px 0 16px", textTransform: "uppercase", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                    <span>OR</span>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
                </div>

                <div className="google-btn-wrapper" style={{ display: "flex", justifyContent: "center" }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Google Sign-In failed")}
                        theme="outline"
                        shape="pill"
                        size="large"
                        width="100%"
                    />
                </div>

                <div className="auth-footer">
                    <span>Don't have an account?</span>
                    <Link to="/register">Create account</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
