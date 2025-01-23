import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './css/LoginPage.css';

const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [userType, setUserType] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (email && password && userType) {
            try {
                const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/login`, {
                    email,
                    password,
                    userType,
                });

                if (response.status === 200) {
                    if (rememberMe) {
                        localStorage.setItem('email', email);
                        localStorage.setItem('userType', userType);
                    } else {
                        localStorage.removeItem('email');
                        localStorage.removeItem('userType');
                    }
                    alert('Login successful!');
                    onLogin(userType);

                    // Navigate with query params
                    navigate(`/?userType=${encodeURIComponent(userType)}`);
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    alert('Invalid credentials or user type.');
                } else {
                    console.error('Login error:', error);
                    alert('An error occurred during login.');
                }
            }
        } else {
            alert('Please enter all required fields.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>Login</h1>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>User Type:</label>
                        <select
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                            required
                        >
                            <option value="">Select User Type</option>
                            <option value="Admin">Admin</option>
                            <option value="User">User</option>
                        </select>
                    </div>
                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label>Remember Me</label>
                    </div>
                    <button type="submit" className="login-button">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
