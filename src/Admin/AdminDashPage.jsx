import React from "react";
import Navbar from "./Navbar";
// import Counter from "../Admin/Counter";
import AdminDash from "./AdminDash";
export default function AdminDashPage() {
  return (
    <div className="flex ">
      <Navbar />
      <AdminDash />
    </div>
  );
}
