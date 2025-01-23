import React, { useState } from 'react';
import axios from 'axios';
import './css/AdminPage.css';

const AdminPage = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState(''); // New state for user type
    const [message, setMessage] = useState('');
    const baseURL = process.env.REACT_APP_BACKEND_URL;

    const sendCredentials = async () => {
        try {
            console.log('Sending payload:', { userId, password, userType });
            const response = await axios.post(`${baseURL}/api/send-credentials`, {
                userId,
                password,
                type: userType, // Sending user type
            });
            console.log('Backend response:', response.data);
            setMessage(`Credentials sent to ${userId}`);
            setUserId('');
            setPassword('');
            setUserType('');
        } catch (error) {
            console.error('Error sending credentials:', error);
            setMessage('Failed to send credentials');
        }
    };

    return (
        <div className="admin-container">
            <h1>Admin Page</h1>
            <p>Input their credentials:</p>

            {/* Input fields for User ID and Password */}
            <div className="credentials-input">
                <input
                    type="text"
                    placeholder="Enter User ID"
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

            {/* Dropdown to select user type */}
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

            {/* Button to send credentials */}
            <button
                onClick={sendCredentials}
                className="send-button"
                disabled={!userId || !password || !userType} // Disabled until all fields are filled
            >
                Send Credentials
            </button>

            {/* Success/Error message */}
            {message && <p>{message}</p>}
        </div>
    );
};

export default AdminPage;
