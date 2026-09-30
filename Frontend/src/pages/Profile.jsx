import { useState } from "react";
import {
    User,
    Sliders,
    Shield,
    Check,
    Lock,
    Bell,
    Palette,
    Sparkles,
    Camera,
    Save,
    RefreshCw,
    LogOut,
    CheckCircle2,
    AlertCircle,
    Globe,
    Moon,
    Sun,
    CreditCard,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

// Unique curated avatar presets
const AVATAR_PRESETS = [
    { id: "fox", emoji: "🦊", label: "Fox", bg: "#4f46e5" },
    { id: "bear", emoji: "🐻", label: "Bear", bg: "#059669" },
    { id: "rocket", emoji: "🚀", label: "Rocket", bg: "#e11d48" },
    { id: "crown", emoji: "👑", label: "Crown", bg: "#d97706" },
    { id: "cosmo", emoji: "🪐", label: "Cosmo", bg: "#9333ea" },
    { id: "spark", emoji: "⚡", label: "Spark", bg: "#0891b2" },
    { id: "diamond", emoji: "💎", label: "Diamond", bg: "#db2777" },
    { id: "cool", emoji: "😎", label: "Cool", bg: "#111827" },
];

// Color Swatches
const COLOR_SWATCHES = [
    "#111827",
    "#4f46e5",
    "#059669",
    "#e11d48",
    "#d97706",
    "#9333ea",
    "#0891b2",
    "#db2777",
    "#2563eb",
];

const Profile = () => {
    const { user, updateUser, logout } = useAuth();

    // Active Tab
    const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'general' | 'security'

    // Form States - Profile
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [phone, setPhone] = useState(user?.phone || "+91 98765 43210");
    const [bio, setBio] = useState(user?.bio || "Splitting expenses with SplitX 💸");
    const [avatarEmoji, setAvatarEmoji] = useState(user?.avatarEmoji || "");
    const [avatarBg, setAvatarBg] = useState(user?.avatarBg || "#111827");
    const [avatarImage, setAvatarImage] = useState(user?.avatarImage || "");

    // Form States - General Settings
    const [currency, setCurrency] = useState(user?.currency || "₹");
    const [theme, setTheme] = useState(user?.theme || "light");
    const [defaultSplit, setDefaultSplit] = useState(user?.defaultSplit || "equal");
    const [notifyExpense, setNotifyExpense] = useState(user?.notifyExpense ?? true);
    const [notifySettlement, setNotifySettlement] = useState(user?.notifySettlement ?? true);
    const [notifyRecurring, setNotifyRecurring] = useState(user?.notifyRecurring ?? true);

    // Form States - Security
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Feedback notifications
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [saving, setSaving] = useState(false);

    // Flash message utility
    const showToast = (msg, isError = false) => {
        if (isError) {
            setErrorMsg(msg);
            setSuccessMsg("");
        } else {
            setSuccessMsg(msg);
            setErrorMsg("");
        }
        setTimeout(() => {
            setSuccessMsg("");
            setErrorMsg("");
        }, 3500);
    };

    // Save Profile Tab
    const handleSaveProfile = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            showToast("Display name cannot be empty.", true);
            return;
        }

        setSaving(true);
        setTimeout(() => {
            updateUser({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                bio: bio.trim(),
                avatarEmoji,
                avatarBg,
                avatarImage: avatarImage.trim(),
            });
            setSaving(false);
            showToast("Profile details updated successfully! 🎉");
        }, 400);
    };

    // Save General Settings Tab
    const handleSaveGeneral = (e) => {
        e.preventDefault();
        setSaving(true);
        setTimeout(() => {
            updateUser({
                currency,
                theme,
                defaultSplit,
                notifyExpense,
                notifySettlement,
                notifyRecurring,
            });
            setSaving(false);
            showToast("General settings saved successfully! ⚙️");
        }, 400);
    };

    // Save Security Tab
    const handleSaveSecurity = (e) => {
        e.preventDefault();
        if (!currentPassword) {
            showToast("Please enter your current password.", true);
            return;
        }
        if (newPassword.length < 6) {
            showToast("New password must be at least 6 characters long.", true);
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("New passwords do not match.", true);
            return;
        }

        setSaving(true);
        setTimeout(() => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSaving(false);
            showToast("Password updated successfully! 🔒");
        }, 500);
    };

    // Select preset avatar
    const selectPreset = (preset) => {
        setAvatarEmoji(preset.emoji);
        setAvatarBg(preset.bg);
        setAvatarImage("");
    };

    return (
        <div className="app-shell">
            <Navbar />

            <div className="app-body">
                <Sidebar />

                <main className="dashboard">
                    {/* Header */}
                    <section className="dashboard-header" style={{ marginBottom: "24px" }}>
                        <div>
                            <p className="eyebrow">SETTINGS & PREFERENCES</p>
                            <h1>Account & Profile</h1>
                            <p className="dashboard-subtitle">
                                Customize your display name, unique profile picture, currency, and general settings.
                            </p>
                        </div>
                    </section>

                    {/* Notifications Toast */}
                    {successMsg && (
                        <div className="profile-toast success">
                            <CheckCircle2 size={18} />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="profile-toast error">
                            <AlertCircle size={18} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* TABS NAVIGATION */}
                    <div className="profile-tabs-header">
                        <button
                            type="button"
                            className={`profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
                            onClick={() => setActiveTab("profile")}
                        >
                            <User size={18} />
                            <span>Profile & Avatar</span>
                        </button>

                        <button
                            type="button"
                            className={`profile-tab-btn ${activeTab === "general" ? "active" : ""}`}
                            onClick={() => setActiveTab("general")}
                        >
                            <Sliders size={18} />
                            <span>General Settings</span>
                        </button>

                        <button
                            type="button"
                            className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
                            onClick={() => setActiveTab("security")}
                        >
                            <Shield size={18} />
                            <span>Security & Account</span>
                        </button>
                    </div>

                    {/* ========================================================= */}
                    {/* TAB 1: PROFILE & AVATAR */}
                    {/* ========================================================= */}
                    {activeTab === "profile" && (
                        <div className="profile-tab-content">
                            <form onSubmit={handleSaveProfile}>
                                {/* Unique Profile Picture / Avatar Section */}
                                <div className="settings-card">
                                    <div className="card-title-row">
                                        <Sparkles size={20} className="text-primary" />
                                        <div>
                                            <h3>Profile Picture & Unique Avatar</h3>
                                            <p>Select a stylized avatar, custom background color, or enter an image URL.</p>
                                        </div>
                                    </div>

                                    <div className="avatar-picker-grid">
                                        {/* Live Preview Card */}
                                        <div className="avatar-preview-box">
                                            {avatarImage ? (
                                                <img src={avatarImage} alt="Avatar" className="avatar-img-large" />
                                            ) : (
                                                <div
                                                    className="avatar-circle-large"
                                                    style={{ backgroundColor: avatarBg }}
                                                >
                                                    {avatarEmoji || name.charAt(0).toUpperCase() || "U"}
                                                </div>
                                            )}
                                            <p className="avatar-preview-label">{name || "Your Name"}</p>
                                            <span className="avatar-preview-email">{email}</span>
                                        </div>

                                        {/* Presets & Customization */}
                                        <div className="avatar-custom-area">
                                            <label className="input-label">Unique Avatar Presets</label>
                                            <div className="preset-badges-row">
                                                {AVATAR_PRESETS.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        className={`preset-badge ${avatarEmoji === p.emoji ? "selected" : ""}`}
                                                        style={{ backgroundColor: p.bg }}
                                                        onClick={() => selectPreset(p)}
                                                        title={p.label}
                                                    >
                                                        <span>{p.emoji}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Color Swatches */}
                                            <label className="input-label" style={{ marginTop: "16px" }}>
                                                Avatar Background Color
                                            </label>
                                            <div className="color-swatches-row">
                                                {COLOR_SWATCHES.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        className={`color-swatch ${avatarBg === color ? "active-swatch" : ""}`}
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => {
                                                            setAvatarBg(color);
                                                        }}
                                                    >
                                                        {avatarBg === color && <Check size={14} color="#fff" />}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Custom Image URL */}
                                            <div className="form-group" style={{ marginTop: "16px" }}>
                                                <label htmlFor="avatar-url">Custom Image URL (Optional)</label>
                                                <input
                                                    id="avatar-url"
                                                    type="url"
                                                    placeholder="https://example.com/my-photo.jpg"
                                                    value={avatarImage}
                                                    onChange={(e) => setAvatarImage(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* General Profile Details */}
                                <div className="settings-card" style={{ marginTop: "24px" }}>
                                    <div className="card-title-row">
                                        <User size={20} />
                                        <div>
                                            <h3>General Profile Information</h3>
                                            <p>Update your display name, contact information, and personal bio.</p>
                                        </div>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label htmlFor="user-display-name">Display Name / Username *</label>
                                            <input
                                                id="user-display-name"
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Cookie Monster"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="user-email">Email Address</label>
                                            <input
                                                id="user-email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="name@example.com"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="user-phone">Phone Number</label>
                                            <input
                                                id="user-phone"
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="+91 98765 43210"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="user-bio">Status / Tagline</label>
                                            <input
                                                id="user-bio"
                                                type="text"
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                placeholder="e.g. Always splitting trips!"
                                            />
                                        </div>
                                    </div>

                                    <div className="card-actions-end">
                                        <button type="submit" className="primary-action" disabled={saving}>
                                            <Save size={17} />
                                            {saving ? "Saving..." : "Save Profile"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 2: GENERAL SETTINGS */}
                    {/* ========================================================= */}
                    {activeTab === "general" && (
                        <div className="profile-tab-content">
                            <form onSubmit={handleSaveGeneral}>
                                {/* Currency & Split Preferences */}
                                <div className="settings-card">
                                    <div className="card-title-row">
                                        <Globe size={20} />
                                        <div>
                                            <h3>Currency & Default Split Preferences</h3>
                                            <p>Set your default currency symbol and split calculation behavior.</p>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Preferred Currency Symbol</label>
                                        <div className="currency-selector-row">
                                            {[
                                                { symbol: "₹", name: "INR (Rupee)" },
                                                { symbol: "$", name: "USD (Dollar)" },
                                                { symbol: "€", name: "EUR (Euro)" },
                                                { symbol: "£", name: "GBP (Pound)" },
                                                { symbol: "¥", name: "JPY (Yen)" },
                                            ].map((c) => (
                                                <button
                                                    key={c.symbol}
                                                    type="button"
                                                    className={`currency-pill ${currency === c.symbol ? "active" : ""}`}
                                                    onClick={() => setCurrency(c.symbol)}
                                                >
                                                    <span className="currency-sym">{c.symbol}</span>
                                                    <span className="currency-lbl">{c.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginTop: "20px" }}>
                                        <label htmlFor="default-split-mode">Default Expense Split Mode</label>
                                        <select
                                            id="default-split-mode"
                                            value={defaultSplit}
                                            onChange={(e) => setDefaultSplit(e.target.value)}
                                            className="select-custom"
                                        >
                                            <option value="equal">Equal Split (Split evenly among all members)</option>
                                            <option value="percentage">Percentage Split (% share per member)</option>
                                            <option value="exact">Exact Amount (Custom exact shares)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Appearance & Notifications */}
                                <div className="settings-card" style={{ marginTop: "24px" }}>
                                    <div className="card-title-row">
                                        <Bell size={20} />
                                        <div>
                                            <h3>Notifications & Preferences</h3>
                                            <p>Manage alert preferences and system notification behavior.</p>
                                        </div>
                                    </div>

                                    <div className="toggle-list">
                                        <div className="toggle-item">
                                            <div>
                                                <strong>Expense Alerts</strong>
                                                <p>Receive notifications when new shared expenses are recorded.</p>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifyExpense}
                                                    onChange={(e) => setNotifyExpense(e.target.checked)}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>

                                        <div className="toggle-item">
                                            <div>
                                                <strong>Settlement Notifications</strong>
                                                <p>Alerts when payments or settlements are logged in your groups.</p>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifySettlement}
                                                    onChange={(e) => setNotifySettlement(e.target.checked)}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>

                                        <div className="toggle-item">
                                            <div>
                                                <strong>Recurring Expense Reminders</strong>
                                                <p>Get notified before recurring expenses hit their due dates.</p>
                                            </div>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={notifyRecurring}
                                                    onChange={(e) => setNotifyRecurring(e.target.checked)}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="card-actions-end">
                                        <button type="submit" className="primary-action" disabled={saving}>
                                            <Save size={17} />
                                            {saving ? "Saving..." : "Save Preferences"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* TAB 3: SECURITY & ACCOUNT */}
                    {/* ========================================================= */}
                    {activeTab === "security" && (
                        <div className="profile-tab-content">
                            <form onSubmit={handleSaveSecurity}>
                                <div className="settings-card">
                                    <div className="card-title-row">
                                        <Lock size={20} />
                                        <div>
                                            <h3>Change Password</h3>
                                            <p>Ensure your account stays secure by using a strong password.</p>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="curr-pass">Current Password</label>
                                        <input
                                            id="curr-pass"
                                            type="password"
                                            placeholder="••••••••"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-group">
                                            <label htmlFor="new-pass">New Password</label>
                                            <input
                                                id="new-pass"
                                                type="password"
                                                placeholder="At least 6 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="confirm-pass">Confirm New Password</label>
                                            <input
                                                id="confirm-pass"
                                                type="password"
                                                placeholder="Re-enter new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="card-actions-end">
                                        <button type="submit" className="primary-action" disabled={saving}>
                                            <Lock size={17} />
                                            Update Password
                                        </button>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="settings-card danger-zone" style={{ marginTop: "24px" }}>
                                    <div className="card-title-row">
                                        <Shield size={20} className="text-danger" />
                                        <div>
                                            <h3 className="text-danger">Account Actions & Session</h3>
                                            <p>Manage active sessions and sign out of your account.</p>
                                        </div>
                                    </div>

                                    <div className="danger-actions-row">
                                        <div>
                                            <strong>Sign Out</strong>
                                            <p>Log out of your current session on this browser.</p>
                                        </div>

                                        <button
                                            type="button"
                                            className="secondary-button danger-btn"
                                            onClick={logout}
                                        >
                                            <LogOut size={16} />
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Profile;
