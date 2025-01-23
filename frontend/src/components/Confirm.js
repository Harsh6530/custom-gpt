import React from 'react';
import './Confirm.css';

const Confirm = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="confirm-overlay">
            <div className="confirm-container">
                <p className="confirm-message">{message}</p>
                <div className="confirm-buttons">
                    <button className="confirm-button confirm-yes" onClick={onConfirm}>
                        Yes
                    </button>
                    <button className="confirm-button confirm-no" onClick={onCancel}>
                        No
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Confirm;
