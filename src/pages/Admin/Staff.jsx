import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
} from "@nextui-org/react";
import Navbar from "./Navbar";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  getDoc,
  query,
  where,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import ModalStaff from "./ModalStaff";
import EditModalStaff from "./EditModalStaff";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-hot-toast";

const Staff = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(auth.currentUser);
  const [staffData, setStaffData] = useState([]);
  const [services, setServices] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  

  const fetchStaffData = useCallback(() => {
    const unsubscribe = onSnapshot(
      collection(db, "staff"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStaffData(data);
      },
      (error) => {
        console.error("Error fetching staff data:", error);
        toast.error("Failed to fetch staff data");
      }
    );
  
    // Return the unsubscribe function
    return unsubscribe;
  }, []);
  // Fetch services from Firestore
  const fetchServices = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "services"));
      const data = querySnapshot.docs.map((doc) => doc.data());
      setServices(data);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    }
  }, []);

  // Effect to fetch initial data on component mount
  useEffect(() => {
    fetchStaffData();
    fetchServices();
  }, [fetchStaffData, fetchServices]);

  // Effect to handle user authentication state changes

  useEffect(() => {
    const checkAuth = () => {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      console.log('Current user:', user);
      if (!user || user.role !== 'admin') {
        console.log('Redirecting to login');
        navigate('/login');
      } else {
        console.log('Admin authenticated');
      }
    };

    checkAuth();
  }, [navigate]);
  
  // Open edit modal for selected staff member
  const handleEdit = (id) => {
    const staff = staffData.find((staff) => staff.id === id);
    setSelectedStaff(staff);
    setIsEditModalOpen(true);
  };

  // Submit edited staff member details
  const handleEditSubmit = async () => {
    try {
      await fetchStaffData();
      toast.success("Staff member updated successfully");
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Failed to update staff member");
    }
  };

  // Delete staff member
const handleDelete = async (docId) => {
  try {
    const confirmed = window.confirm("Are you sure you want to delete this staff member?");
    if (!confirmed) {
      return;
    }

    // Construct the document reference using the Firestore document ID
    const staffDocRef = doc(db, "staff", docId);
   
    // Delete the document from 'staff'
    await updateDoc(staffDocRef,{active : false});

    // Update local state after deletion
    setStaffData((prevData) => prevData.filter((staff) => staff.id !== docId));

    toast.success("Staff member deleted successfully");
  } catch (error) {
    console.error("Error deleting document: ", error);
    toast.error("Failed to delete staff member");
  }
};


  // Open add staff modal
  const handleAddStaff = () => {
    setSelectedStaff(null);
    setIsAddModalOpen(true);
  };

  // Close modals and refresh staff data
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    fetchStaffData(); // Refresh user data after closing modal
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] min-h-screen">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="flex flex-col p-4 md:p-6 lg:p-8 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="font-semibold text-lg sm:text-xl">
            <h2>Active Staffs</h2>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
            <Input
              isClearable
              radius="lg"
              classNames={{
                label: "text-black/50 dark:text-white/90",
                input: [
                  "bg-transparent",
                  "text-black/90 dark:text-white/90",
                  "placeholder:text-default-700/50 dark:placeholder:text-white/60",
                ],
                innerWrapper: "bg-transparent",
                inputWrapper: [
                  "shadow-xl",
                  "bg-default-200/50",
                  "dark:bg-default/60",
                  "backdrop-blur-xl",
                  "backdrop-saturate-200",
                  "hover:bg-default-200/70",
                  "dark:hover:bg-default/70",
                  "group-data-[focused=true]:bg-default-200/50",
                  "dark:group-data-[focused=true]:bg-default/60",
                  "!cursor-text",
                ],
              }}
              placeholder="Type to search..."
              startContent={<FaSearch />}
              className="w-full sm:w-[300px]"
            />
            <Button
              color="primary"
              className="w-full sm:w-auto bg-[#908fe2]"
              onClick={handleAddStaff}
            >
              + Add Staff
            </Button>
          </div>
        </div>
        {staffData.length === 0 ? (
          <p>No valid data available</p>
        ) : (
          <div className="overflow-x-auto">
            <Table aria-label="Staff table" className="min-w-full">
              <TableHeader>
                <TableColumn>Sl. no.</TableColumn>
                <TableColumn>Name</TableColumn>
                <TableColumn className="hidden sm:table-cell">Email</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {staffData.filter(i => i.active).map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.staffName}</TableCell>
                    <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          size="mini"
                          className="bg-[#b9b0eb]"
                          onClick={() => handleEdit(user.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          color="error"
                          size="mini"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <ModalStaff
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSubmit={fetchStaffData}
      />
      <EditModalStaff
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        staff={selectedStaff}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

export default Staff;
