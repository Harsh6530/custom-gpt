import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidePanel from "./components/AdminSidePanel"; // ✅ Import Admin Side Panel
import Alert from "./components/Alert"; // ✅ Import Custom Alert
import Loading from "./components/Loading"; // ✅ Import Custom Loading
import "./css/ExistingUser.css";
import Confirm from "./components/Confirm"; // ✅ Import Custom Confirm Component

const ExistingUser = () => {
    const [users, setUsers] = useState([]);
    const [editUser, setEditUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: "", type: "" });
    const [isPanelOpen, setIsPanelOpen] = useState(false); // ✅ State for sidebar
    const baseURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

    // ✅ Fetch users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${baseURL}/api/get-users`);
            console.log("🔍 API Response:", response.data);
            setUsers(response.data || []);
        } catch (error) {
            console.error("❌ Error fetching users:", error);
            showAlert("Failed to load users.", "error");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Handle input change for editing
    const handleEditChange = (e) => {
        setEditUser({ ...editUser, [e.target.name]: e.target.value });
    };

    // ✅ Update user details
    const handleUpdateUser = async () => {
        if (!editUser) return;
        setLoading(true);
        try {
            const response = await axios.put(`${baseURL}/api/update-user/${editUser._id}`, editUser);
            if (response.data.success) {
                fetchUsers();
                setEditUser(null);
                showAlert("✅ User updated successfully!", "success"); // ✅ Show success prompt
            } else {
                showAlert("❌ Error updating user!", "error");
            }
        } catch (error) {
            console.error("❌ Error updating user:", error);
            showAlert("Failed to update user.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Delete user
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        setLoading(true);
        try {
            await axios.delete(`${baseURL}/api/delete-user/${userId}`);
            fetchUsers();
            showAlert("✅ User deleted successfully!", "success"); // ✅ Show success prompt
        } catch (error) {
            console.error("❌ Error deleting user:", error);
            showAlert("Failed to delete user.", "error");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Show Alert Function
    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: "", type: "" }), 3000);
    };

    return (
        <div className="existing-user-container">
            {loading && <Loading />} {/* ✅ Custom Loading Component */}
            {alert.show && <Alert message={alert.message} type={alert.type} />} {/* ✅ Custom Alert Component */}

            {/* ✅ Header with Hamburger Menu */}
            <div className="admin-header">
                <button className="hamburger-menu" onClick={() => setIsPanelOpen(true)}>☰</button>
                <h2>Manage Users</h2>
            </div>

            <table className="user-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>User Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(users) && users.length > 0 ? (
                        users.map((user) => (
                            <tr key={user._id}>
                                <td>{user.email}</td>
                                <td>{user.type}</td>
                                <td>
                                    <button onClick={() => setEditUser(user)} className="admin-edit-button">Edit</button>
                                    <button onClick={() => handleDeleteUser(user._id)} className="admin-delete-button">Delete</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3">⚠ No users found.</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* ✅ Edit Modal */}
            {editUser && (
                <div className="edit-modal">
                    <h3>Edit User</h3>
                    <input type="email" name="email" value={editUser.email} onChange={handleEditChange} />
                    <select name="type" value={editUser.type} onChange={handleEditChange}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    <input type="password" name="password" placeholder="New Password (optional)" onChange={handleEditChange} />
                    <button onClick={handleUpdateUser} className="save-button">Save</button>
                    <button onClick={() => setEditUser(null)} className="cancel-button">Cancel</button>
                </div>
            )}

            {/* ✅ Admin Side Panel */}
            <AdminSidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
        </div>
    );
};

export default ExistingUser;
