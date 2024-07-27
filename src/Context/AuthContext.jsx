import React, { createContext, useState, useEffect } from 'react';
import { db } from '../services/firebase'; // Make sure to import your Firebase configuration
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

export const AuthContext = createContext({
    updateCompletedCount: (newCount) => {},
});

export const AuthProvider = ({ children }) => {
    const [email, setEmail] = useState(null);
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('currentUser'));
        if (userData) {
            setEmail(userData.email);
        }
    }, []);

    useEffect(() => {
        if (!email) return;

        // Fetch the initial completed count
        const countersCollection = collection(db, 'counters');
        const q = query(countersCollection, where('email', '==', email));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((docSnapshot) => {
              if (docSnapshot.exists()) {
                const counterData = docSnapshot.data();
                updateCompletedCount(counterData.completed || 0);
              }
            });
          });

        return () => unsubscribe(); // Cleanup the listener when the component unmounts
    }, [email]); // This useEffect runs when email changes

    const updateCompletedCount = (newCount) => {
        setCompletedCount(newCount);
    };

    return (
        <AuthContext.Provider value={{ 
            email, 
            setEmail, 
            completedCount, 
            setCompletedCount,
            updateCompletedCount 
        }}>
            {children}
        </AuthContext.Provider>
    );
};
