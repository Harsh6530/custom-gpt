import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Alert from './components/Alert';
import Loading from './components/Loading';
import './css/AdminPage.css';

const AdminPage = () => {
    const [authPassword, setAuthPassword] = useState(''); // Password input field
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state
    const [adminPassword, setAdminPassword] = useState(''); // Admin password input
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('');
    const [message, setMessage] = useState('');
    const [alertType, setAlertType] = useState('');
    const [loading, setLoading] = useState(false);
    const baseURL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        // Check if admin is already authenticated (persistent session)
        const storedAuth = localStorage.getItem('isAdminAuthenticated');
        if (storedAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const checkAdminPassword = () => {
        const correctPassword = "SecureAdmin123"; // 🔒 Change this to a secure password
        if (authPassword === correctPassword) {
            setIsAuthenticated(true);
            localStorage.setItem('isAdminAuthenticated', 'true'); // Persist session
        } else {
            setMessage('Incorrect admin password!');
            setAlertType('error');
        }
        setAuthPassword(''); // Clear input after submission
    };

    const logoutAdmin = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAdminAuthenticated'); // Clear session
    };

    const sendCredentials = async () => {
        setLoading(true);
        try {
            console.log('Sending payload:', { userId, password, userType });
            const response = await axios.post(`${baseURL}/api/send-credentials`, {
                userId,
                password,
                type: userType,
            });
            console.log('Backend response:', response.data);
            setMessage(`Credentials sent to ${userId}`);
            setAlertType('success');
            setUserId('');
            setPassword('');
            setUserType('');
        } catch (error) {
            console.error('Error sending credentials:', error);
            setMessage('Failed to send credentials');
            setAlertType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            {loading && <Loading />}
            {message && <Alert message={message} type={alertType} />}
            
            {!isAuthenticated ? (
                <div className="auth-box">
                    <h1>Admin Login</h1>
                    <input
                        type="password"
                        placeholder="Enter Admin Password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="input-field"
                    />
                    <button onClick={checkAdminPassword} className="auth-button">
                        Authenticate
                    </button>
                </div>
            ) : (
                <div className="admin-box">
                    <h1>Admin Page</h1>
                    

                    <p>Input credentials:</p>
                    <div className="credentials-input">
                        <input
                            type="text"
                            placeholder="Enter Email ID"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="input-field"
                        />
                        <input
                            type="password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div className="dropdown-container">
                        <select
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                            className="dropdown-select"
                        >
                            <option value="">Select User Type</option>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button
                        onClick={sendCredentials}
                        className="send-button"
                        disabled={!userId || !password || !userType}
                    >
                        Send Credentials
                    </button>
                    <button onClick={logoutAdmin} className="log-b">
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminPage;
