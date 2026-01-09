import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);

    const login = async (userType, username, password) => {
        try {
            const res = await axios.post('http://localhost:8081/login', {
                userType, 
                username, 
                password
            });

            if (res.data.Status === "Success") {
                setCurrentUser(res.data);
                
                // ✅ FIXED: Return ALL data (including id and role)
                return { 
                    ...res.data, 
                    userType: userType 
                };
            } else {
                throw new Error(res.data.Error);
            }
        } catch (error) {
            throw error;
        }
    };

    const value = {
        currentUser,
        login
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};