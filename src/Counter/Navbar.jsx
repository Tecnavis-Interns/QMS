import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@nextui-org/react";
// import { signOutUser } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useContext } from 'react';
import { AuthContext } from '../Context/AuthContext';

export default function App() {
  const { email } = useContext(AuthContext);
  const navigate = useNavigate();
  const handleLogout = () => {
    // Clear any local storage or state related to the user's session
    localStorage.removeItem('user'); // Assuming you store user info in localStorage
    // Navigate to the login page
    navigate("/login");
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