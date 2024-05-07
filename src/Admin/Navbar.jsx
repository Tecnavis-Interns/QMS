import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@nextui-org/react";
import { signOutUser } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    await signOutUser();
    navigate("/");
  };
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex flex-col justify-between w-64  bg-[#1c1c84]">
        <div className="flex items-center justify-center h-20">
          <p className="font-bold text-white hidden sm:block">
            Queue Management System
          </p>
          <p className="font-bold text-white sm:hidden">QMS</p>
        </div>
        <div className="flex flex-col items-center p-9">
          <div className="flex flex-col flex-1 justify-start"> {/* Change justify-center to justify-start */}
            <p className="text-white">Admin Dashboard</p>
          </div>
        </div>
        {/* Logout Button */}
        <Button
          as={Link}
          className="w-3/4 mt-auto mx-auto bg-gray-900 text-white mb-5" // Use mt-auto to push the button to the bottom
          href="#"
          variant="flat"
          onClick={handleLogout}
        >
          Logout
        </Button>
        
      </aside>
    </div>
  );
}
