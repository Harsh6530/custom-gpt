import React, { useState } from 'react';
import axios from 'axios';
import Alert from './components/Alert';
import Loading from './components/Loading';
import './css/AdminPage.css';

const AdminPage = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('');
    const [message, setMessage] = useState('');
    const [alertType, setAlertType] = useState(''); // For success or error alert
    const [loading, setLoading] = useState(false); // To show loading spinner
    const baseURL = process.env.REACT_APP_BACKEND_URL;

    const sendCredentials = async () => {
        setLoading(true); // Start loading
        try {
            console.log('Sending payload:', { userId, password, userType });
            const response = await axios.post(`${baseURL}/api/send-credentials`, {
                userId,
                password,
                type: userType, // Sending user type
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
            setLoading(false); // Stop loading
        }
    };

    return (
        <div className="admin-container">
            {loading && <Loading />} {/* Loading spinner */}
            {message && <Alert message={message} type={alertType} />} {/* Alert component */}
            
            <div className="admin-box">
                <h1>Admin Page</h1>
                <p>Input credentials:</p>

                {/* Input fields for User ID and Password */}
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
            </div>
        </div>
    );
};

export default AdminPage;
