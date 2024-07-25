import React from "react";
import {
  Link,
  Button,
} from "@nextui-org/react";
// import { signOutUser } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from "react-router-dom";
import { useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';

export default function App() {
  const { email } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleLogout = async () => {
    console.log("Logout process started");
    const userData = JSON.parse(localStorage.getItem('currentUser'));
    console.log("User data from localStorage:", userData);
  
    if (userData && userData.role === 'counter') {
      console.log("User is a counter, attempting to set inactive");
      const counterEmail = userData.email;
      const countersCollectionRef = collection(db, 'counters');
      const q = query(countersCollectionRef, where("email", "==", counterEmail));
      
      try {
        const querySnapshot = await getDocs(q);
        console.log("Query snapshot:", querySnapshot);
        if (!querySnapshot.empty) {
          const counterDoc = querySnapshot.docs[0];
          console.log("Counter document found:", counterDoc.id);
          const counterDocRef = doc(db, 'counters', counterDoc.id);
          await updateDoc(counterDocRef, { active: false });
          console.log(`Counter ${counterEmail} is now set to inactive`);
        } else {
          console.log('Counter document not found');
        }
      } catch (error) {
        console.error("Error setting counter as inactive:", error);
      }
    }
    
    // Clear user data from localStorage
    localStorage.removeItem('currentUser');
    console.log("Local storage cleared");
    
    // Redirect to login page
    navigate('/login');
    console.log("Navigated to login page");
  };
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#6e71d6] flex flex-col">
        <div className="flex items-center justify-center h-16">
          <p className="font-bold text-white hidden sm:block">
            Queue Management System
          </p>
          <p className="font-bold text-white sm:hidden">QMS</p>
        </div>
        <div className="flex flex-col flex-grow">
          <div className="flex-grow p-4 ml-8">
            <p className="text-white">Counter Dashboard</p>
            {/* Add other sidebar items here */}
          </div>
          <div className="p-4">
            <Button
              as={Link}
              className="w-full bg-white text-black hover:bg-[#d4ccf4] transition-colors duration-200 rounded-md"
              variant="flat"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}