import React, { createContext, useState, useEffect } from 'react';

// Create the context
export const UserContext = createContext();

// Provide the context to the app
export const UserProvider = ({ children }) => {
    // Load userType from localStorage on first render
    const [userType, setUserType] = useState(() => {
        return localStorage.getItem('userType') || ''; // Get userType from localStorage
    });

    // Save userType to localStorage whenever it changes
    useEffect(() => {
        console.log('UserContext: ', userType);
        if (userType) {
            localStorage.setItem('userType', userType);
        } else {
            console.log('userType is empty');
            localStorage.removeItem('userType'); // Clear storage if empty
        }
    }, [userType]);

    return (
        <UserContext.Provider value={{ userType, setUserType }}>
            {children}
        </UserContext.Provider>
    );
};
