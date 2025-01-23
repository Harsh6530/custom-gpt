import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import SidePanel from './components/SidePanel';
import HomePage from './HomePage';
import ProjectPage from './ProjectPage';
import LoginPage from './LoginPage';
import AdminPage from './AdminPage';
import './css/App.css';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication status on component mount
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
    };

    const RenderHeaderAndSidePanel = () => {
        const location = useLocation();
        const isAdminRoute = location.pathname.startsWith('/admin');

        if (isAuthenticated && !isAdminRoute) {
            return (
                <>
                    <header className="static-header">
                        <div className="header-title">Custom GPT</div>
                        <button className="logout-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </header>
                    <SidePanel />
                </>
            );
        }
        return null; // Don't render for admin routes or unauthenticated users
    };

    return (
        <Router>
            <div className="app-container">
                <RenderHeaderAndSidePanel />

                <main className="main-content">
                    <Routes>
                        {/* LoginPage */}
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

                        {/* Protected Routes */}
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
                        <Route
                            path="/admin"
                            element={<AdminPage />}
                        />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default App;
