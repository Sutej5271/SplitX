import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000",
    headers: {
        "Content-Type": "application/json",
    },
});

// Helper: Check if JWT token is expired
export const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const payloadBase64 = token.split(".")[1];
        if (!payloadBase64) return true;
        const decoded = JSON.parse(atob(payloadBase64));
        if (!decoded.exp) return false;
        return decoded.exp * 1000 < Date.now();
    } catch (err) {
        return true;
    }
};

// Request Interceptor: Attach token if valid, otherwise clear & redirect
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            if (isTokenExpired(token)) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                if (
                    typeof window !== "undefined" &&
                    window.location.pathname !== "/login" &&
                    window.location.pathname !== "/register"
                ) {
                    window.location.href = "/login?reason=expired";
                }
                return Promise.reject(new Error("Token expired"));
            }

            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Catch 401/403 Invalid or expired token responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.response?.data?.error;

        if (
            status === 401 ||
            status === 403 ||
            message === "Invalid or expired token" ||
            message === "Access token required" ||
            message === "Invalid authorization format"
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            if (
                typeof window !== "undefined" &&
                window.location.pathname !== "/login" &&
                window.location.pathname !== "/register"
            ) {
                window.location.href = "/login?reason=expired";
            }
        }

        return Promise.reject(error);
    }
);

export default api;