import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [email, setEmail] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    if (userData) {
      setEmail(userData.email);
    }
  }, []);
  return (
    <AuthContext.Provider value={{ email, setEmail }}>
      {children}
    </AuthContext.Provider>
  );
};