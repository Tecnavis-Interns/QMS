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
    navigate("/login");
  };
  return (
    <Navbar>
      <NavbarContent>
        <NavbarBrand>
          <p class="font-bold text-inherit sm:hidden">QMS</p>
          <p class="font-bold text-inherit hidden sm:block">
            Queue Management System
          </p>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent className="!justify-center">
        <p>Admin Dashboard</p>
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Button
            as={Link}
            className="bg-[#6236F5] text-white"
            href="#"
            variant="flat"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
