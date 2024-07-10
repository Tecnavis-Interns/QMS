import {
  Button,
  Link
} from "@nextui-org/react";
import { signOutUser } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOutUser();
    navigate("/");
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-64 bg-red-300 flex flex-col">
        <div className="flex items-center justify-center h-16 bg-red-400">
          <p className="font-bold text-white hidden sm:block">
            Queue Management System
          </p>
          <p className="font-bold text-white sm:hidden">QMS</p>
        </div>
        <div className="flex flex-col items-center justify-between flex-grow p-4">
          <div className="mt-20 w-64 space-y-2">
            {[
              { path: "/adminDash", label: "Dashboard" },
              { path: "/counter", label: "Counter" },
              { path: "/staff", label: "Staff" },
              { path: "/services", label: "Services" },
              { path: "/ads", label: "Advertisement" }
            ].map((item) => (
              <Button
                key={item.path}
                as={Link}
                variant="flat"
                onClick={() => navigate(item.path)}
                className={`w-full text-red-800 rounded-md py-2 transition-colors duration-200 ${
                  location.pathname === item.path 
                    ? "bg-red-100 font-semibold" 
                    : "bg-red-200 hover:bg-red-100"
                }`}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Button
            as={Link}
            className="w-full mt-4 bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 rounded-md"
            variant="flat"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </aside>
    </div>
  );
}