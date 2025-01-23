import React, { createContext, useState } from 'react';

// Create the context
export const UserContext = createContext();

// Provide the context to the app
export const UserProvider = ({ children }) => {
    const [userType, setUserType] = useState(''); // Declare `userType` as state

    return (
        <UserContext.Provider value={{ userType, setUserType }}>
            {children}
        </UserContext.Provider>
    );
};
