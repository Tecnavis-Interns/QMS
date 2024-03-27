import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Button,
} from "@nextui-org/react";

export default function App() {
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
      <NavbarContent justify="end">
        <NavbarItem>
          <Button
            as={Link}
            className="bg-[#6236F5] text-white"
            href="/userForm"
            variant="flat"
          >
            Book your slot
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
