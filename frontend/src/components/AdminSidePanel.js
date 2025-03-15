import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminSidePanel.css"; // ✅ Import CSS

const AdminSidePanel = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    return (
        <div className={`admin-sidepanel-overlay ${isOpen ? "open" : ""}`}>
            <div className="admin-sidepanel">
                {/* ✅ Close Button */}
                <button className="close-btn" onClick={onClose}>✖</button>

                <h2>Admin Menu</h2>

                {/* ✅ Add New User */}
                <button className="panel-button" onClick={() => navigate("/admin")}>
                    ➕ Add New User
                </button>

                {/* ✅ Existing Users */}
                <button className="panel-button" onClick={() => navigate("/existing-users")}>
                    👥 Existing Users
                </button>
            </div>
        </div>
    );
};

export default AdminSidePanel;
