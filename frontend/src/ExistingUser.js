import React, { useState, useEffect } from "react";
import axios from "axios";
import AdminSidePanel from "./components/AdminSidePanel"; // ✅ Import Admin Side Panel
import "./css/ExistingUser.css";

const ExistingUser = () => {
    const [users, setUsers] = useState([]);
    const [editUser, setEditUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false); // ✅ State for opening sidebar
    const baseURL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"; // ✅ Ensure this is set

    // ✅ Fetch users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${baseURL}/api/get-users`);
            console.log("🔍 API Response:", response.data);
            setUsers(response.data || []);
        } catch (error) {
            console.error("❌ Error fetching users:", error);
            setError("Failed to load users.");
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
        try {
            setLoading(true);
            const response = await axios.put(`${baseURL}/api/update-user/${editUser._id}`, editUser);
            if (response.data.success) {
                fetchUsers(); // ✅ Refresh users
                setEditUser(null);
            } else {
                alert("Error updating user!");
            }
        } catch (error) {
            console.error("❌ Error updating user:", error);
            alert("Failed to update user.");
        } finally {
            setLoading(false);
        }
    };

    // ✅ Delete user
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            setLoading(true);
            await axios.delete(`${baseURL}/api/delete-user/${userId}`);
            fetchUsers(); // ✅ Refresh list
        } catch (error) {
            console.error("❌ Error deleting user:", error);
            alert("Failed to delete user.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="existing-user-container">
            {/* ✅ Header with Hamburger Menu */}
            <div className="admin-header">
                <button className="hamburger-menu" onClick={() => setIsPanelOpen(true)}>☰</button>
                <h2>Manage Users</h2>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className="error-message">{error}</p>}

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
