import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loading from './components/Loading';
import Alert from './components/Alert';
import './css/LoginPage.css';
import { UserContext } from './components/UserContext';

const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    //const [userType, setUserType] = useState('');
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const navigate = useNavigate();
    const { userType, setUserType } = useContext(UserContext);

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (email && password && userType) {
            console.log(userType);
            setLoading(true); // Show loading spinner
            setUserType(userType);
            localStorage.setItem('userType', userType);
            try {
                const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/login`, {
                    email,
                    password,
                    userType,
                });

                if (response.status === 200) {
                    if (rememberMe) {
                        localStorage.setItem('email', email);
                    } else {
                        localStorage.removeItem('email');
                    }
                    showAlert('Login successful!', 'success');
                    onLogin(userType);

                    // Navigate with query params
                    navigate(`/?userType=${encodeURIComponent(userType)}`);
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    showAlert('Invalid credentials or user type.', 'error');
                } else {
                    console.error('Login error:', error);
                    showAlert('An error occurred during login.', 'error');
                }
            } finally {
                setLoading(false); // Hide loading spinner
            }
        } else {
            showAlert('Please enter all required fields.', 'error');
        }
    };

    // useEffect(() => {
    //     console.log('UserType updated:', userType);
    // }, [userType]);
    

    return (
        <div className="login-container">
            {loading && <Loading />} {/* Show Loading Spinner */}
            {alert.show && <Alert message={alert.message} type={alert.type} onClose={() => setAlert({ show: false })} />} {/* Show Alert */}

            <div className="login-box">
                <h1>Custom GPT Login</h1>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            placeholder="Enter Email ID"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            placeholder="Enter Password"
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
