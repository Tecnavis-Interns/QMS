import Navbar from "./Navbar";
import AdminDash from "./AdminDash";

export default function AdminDashPage() {
  return (
    <div className="h-screen flex">
      <div className="w-64 fixed h-full">
        <Navbar />
      </div>
      <div className="ml-64 flex-1 overflow-y-auto scrollbar-hide">
        <AdminDash />
      </div>
    </div>
  );
}