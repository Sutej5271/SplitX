import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WalletCards } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

import { registerUser, loginUser } from "../api/authApi";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

const Register = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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

        if (!formData.name || !formData.email || !formData.password) {
            setError("Please fill in all fields.");
            return;
        }

        try {
            setLoading(true);
            await registerUser(formData);

            // Automatically log in user after registration
            try {
                const loginData = await loginUser({
                    email: formData.email,
                    password: formData.password,
                });
                login(loginData);
                navigate("/dashboard");
            } catch (loginErr) {
                navigate("/login", {
                    state: { message: "Account created successfully! Please log in." },
                });
            }
        } catch (error) {
            console.error(error);
            const message =
                error.response?.data?.message ||
                error.response?.data?.error ||
                `Registration failed (${error.response?.status || "unknown error"})`;
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
            console.error("Google registration error:", err);
            const serverError = err.response?.data?.message || err.response?.data?.error;
            if (serverError) {
                setError(serverError);
            } else if (err.code === "ERR_NETWORK" || !err.response) {
                setError("Cannot connect to backend server. Please verify backend deployment.");
            } else {
                setError("Google Sign-Up failed.");
            }
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
                    <h2>Create your account</h2>
                    <p>Start managing shared expenses with your group.</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Your name"
                            value={formData.name}
                            onChange={handleChange}
                            autoComplete="name"
                        />
                    </div>

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
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create account"}
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
                        text="signup_with"
                    />
                </div>

                <div className="auth-footer">
                    <span>Already have an account?</span>
                    <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
