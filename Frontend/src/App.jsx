import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GroupDetails from "./pages/GroupDetails";
import Settlements from "./pages/Settlements";
import Recurring from "./pages/Recurring";
import Profile from "./pages/Profile";


function App() {
    return (
        <BrowserRouter>

            <AuthProvider>

                <Routes>

                    {/* ============================= */}
                    {/* DEFAULT */}
                    {/* ============================= */}

                    <Route
                        path="/"
                        element={
                            <Navigate
                                to="/dashboard"
                                replace
                            />
                        }
                    />


                    {/* ============================= */}
                    {/* AUTH */}
                    {/* ============================= */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />

                    <Route
                        path="/register"
                        element={<Register />}
                    />


                    {/* ============================= */}
                    {/* DASHBOARD */}
                    {/* ============================= */}

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />


                    {/* ============================= */}
                    {/* PROFILE & SETTINGS */}
                    {/* ============================= */}

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />


                    {/* ============================= */}
                    {/* GROUP DETAILS */}
                    {/* ============================= */}

                    <Route
                        path="/groups/:groupId"
                        element={
                            <ProtectedRoute>
                                <GroupDetails />
                            </ProtectedRoute>
                        }
                    />


                    {/* ============================= */}
                    {/* SETTLEMENTS */}
                    {/* ============================= */}

                    <Route
                        path="/groups/:groupId/settlements"
                        element={
                            <ProtectedRoute>
                                <Settlements />
                            </ProtectedRoute>
                        }
                    />


                    {/* ============================= */}
                    {/* RECURRING EXPENSES */}
                    {/* ============================= */}

                    <Route
                        path="/groups/:groupId/recurring"
                        element={
                            <ProtectedRoute>
                                <Recurring />
                            </ProtectedRoute>
                        }
                    />

                </Routes>

            </AuthProvider>

        </BrowserRouter>
    );
}

export default App;