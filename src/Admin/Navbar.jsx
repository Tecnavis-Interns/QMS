import {
  Button,
  Link
} from "@nextui-org/react";
// import { signOutUser } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Clear any local storage or state related to the user's session
    localStorage.removeItem('user'); // Assuming you store user info in localStorage
    // Navigate to the login page
    navigate("/login");
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
    <aside className="w-64 bg-[#908fe2] flex flex-col">
        <div className="flex items-center justify-center h-16">
          <p className="font-bold text-white hidden sm:block">
            Queue Management System
          </p>
          <p className="font-bold text-white sm:hidden">QMS</p>
        </div>
        <div className="flex flex-col items-center justify-between flex-grow p-6">
          <div className="mt-20 w-64 space-y-2">
            {[
              { path: "/adminDash", label: "Dashboard" },
              { path: "/counter", label: "Counter" },
              { path: "/staff", label: "Staff" },
              { path: "/services", label: "Services" },
              { path: "/ads", label: "Advertisement" },
              { path: "/reports", label: "Reports" } ,  
            ].map((item) => (
              <Button
                key={item.path}
                as={Link}
                variant="flat"
                onClick={() => navigate(item.path)}
                className={`w-full  text-white rounded-md py-2 transition-colors duration-200 ${
                  location.pathname === item.path 
                    ? "bg-[#6e71d6] font-semibold" 
                    : "bg-[#b9b0eb] hover:bg-[#d4ccf4]"
                }`}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Button
            as={Link}
            className="w-full mt-4 bg-white text-black hover:bg-[#d4ccf4] transition-colors duration-200 rounded-md"
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