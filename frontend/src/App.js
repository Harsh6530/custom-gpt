import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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

    return (
        <Router>
            <div className="app-container">
                {isAuthenticated && (
                    <header className="static-header">
                        <div className="header-title">Custom GPT</div>
                        <button className="logout-button" onClick={handleLogout}>
                            Logout
                        </button>
                    </header>
                )}

                {isAuthenticated && <SidePanel />}

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
