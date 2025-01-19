import React from "react";
import "./Alert.css";

const Alert = ({ message, type, onClose }) => {
    return (
        <div className={`alert-container ${type}`}>
            <p>{message}</p>
            {/* <button className="close-btn" onClick={onClose}>
                &times;
            </button> */}
        </div>
    );
};

export default Alert;
