import React from "react";
import styles from "./Confirm.module.css"; // ✅ Import CSS Module

const Confirm = ({ message, onConfirm, onCancel }) => {
    return (
        <div className={styles.confirmOverlay}>
            <div className={styles.confirmBox}>
                <p>{message}</p>
                <div className={styles.buttonContainer}>
                    <button className={styles.confirmButton} onClick={onConfirm}>Yes</button>
                    <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default Confirm;
