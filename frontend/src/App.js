import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import SidePanel from './components/SidePanel';
import AdminSidePanel from './components/AdminSidePanel'; // ✅ Admin Side Panel
import HomePage from './HomePage';
import ProjectPage from './ProjectPage';
import LoginPage from './LoginPage';
import AdminPage from './AdminPage';
import ExistingUser from './ExistingUser'; // ✅ Existing Users Page
import { UserProvider } from './components/UserContext';
import './css/App.css';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false); // ✅ Track Admin Panel state

    // ✅ Check authentication status on component mount
    useEffect(() => {
        const savedAuth = localStorage.getItem('isAuthenticated');
        setIsAuthenticated(savedAuth === 'true');
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userType');
    };

    const RenderHeaderAndSidePanel = () => {
        const location = useLocation();
        const isAdminPage = location.pathname.startsWith('/admin');
        const isExistingUsersPage = location.pathname.startsWith('/existing-users'); // ✅ Check Existing Users Page

        if (isAuthenticated && !isAdminPage && !isExistingUsersPage) { // ✅ Hide SidePanel for `/existing-users`
            return (
                <>
                    <header className="static-header">
                        <div className="header-title">Custom GPT</div>
                        <button className="logout-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </header>
                    <SidePanel /> {/* ✅ Show SidePanel only when not on Admin or Existing Users page */}
                </>
            );
        }

        if (isAuthenticated && isAdminPage) {
            return (
                <>
                    {/* ✅ Show Admin Side Panel */}
                    <AdminSidePanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />
                </>
            );
        }

        return null; // ✅ No side panel for admin or existing-users
    };

    return (
        <UserProvider>
            <Router>
                <div className="app-container">
                    <RenderHeaderAndSidePanel />

                    <main className="main-content">
                        <Routes>
                            {/* ✅ Login Page */}
                            <Route
                                path="/login"
                                element={
                                    isAuthenticated ? (
                                        <Navigate to="/" replace />
                                    ) : (
                                        <LoginPage onLogin={handleLogin} />
                                    )
                                }
                            />

                            {/* ✅ Protected Routes */}
                            <Route
                                path="/"
                                element={
                                    isAuthenticated ? (
                                        <HomePage />
                                    ) : (
                                        <Navigate to="/login" replace />
                                    )
                                }
                            />
                            <Route
                                path="/:projectName"
                                element={
                                    isAuthenticated ? (
                                        <ProjectPage />
                                    ) : (
                                        <Navigate to="/login" replace />
                                    )
                                }
                            />

                            {/* ✅ Admin Page */}
                            <Route path="/admin" element={<AdminPage />} />

                            {/* ✅ Existing Users Page */}
                            <Route path="/existing-users" element={<ExistingUser />} />
                        </Routes>
                    </main>
                </div>
            </Router>
        </UserProvider>
    );
};

export default App;
