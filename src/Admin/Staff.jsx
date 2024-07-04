import React, { useState, useEffect } from "react";
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
import { collection, getDocs, deleteDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import ModalStaff from "./ModalStaff";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-hot-toast";

const Staff = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(auth.currentUser);
  const [userData, setUserData] = useState([]);
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        navigate("/login");
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "staff"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserData(data);
      } catch (error) {
        console.error("Error fetching staff data:", error);
      }
    };

    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "services"));
        const data = querySnapshot.docs.map((doc) => doc.data());
        setServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchUserData();
    fetchServices();
  }, []);

  const handleEdit = (id) => {
    const staff = userData.find((staff) => staff.id === id);
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      fetchUserData();
      toast.success("Staff member updated successfully");
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Failed to update staff member");
    }
  };

  const handleDelete = async (id) => {
    try {
      const staffRef = doc(db, "staff", id);
      const delStaffRef = doc(db, "DeletedStaff", id);
      const staffSnap = await getDoc(staffRef);
      if (!staffSnap.exists()) {
        toast.error("No such document!");
        return;
      }
      const staffData = staffSnap.data();

      const confirmDelete = async () => {
        await setDoc(delStaffRef, staffData);
        await deleteDoc(staffRef);
        setUserData(userData.filter((staff) => staff.id !== id));
        toast.success("Staff member deleted successfully");
      };

      toast((t) => (
        <span>
          Are you sure you want to delete this staff member?
          <Button
            onClick={() => {
              toast.dismiss(t.id);
              confirmDelete();
            }}
          >
            Yes
          </Button>
          <Button onClick={() => toast.dismiss(t.id)}>No</Button>
        </span>
      ));
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast.error("Failed to delete staff member");
    }
  };

  const handleAddStaff = async () => {
    setSelectedStaff(null);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen">
      <div className="fixed h-full">
        <Navbar />
      </div>
      <div className="flex flex-col flex-1 ml-64">
        <div className="flex justify-end mt-4 mr-[100px]">
          <div className="w-[300px]">
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
            />
          </div>
        </div>
        <div className="lg:mx-24 flex justify-start flex-wrap gap-1">
          <div className="flex items-center justify-start gap-1 w-full py-6">
            <ModalStaff
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              services={services.map((service) => service.name)}
              staff={selectedStaff}
              onSubmit={handleEditSubmit}
            />
          </div>
          <div className="flex flex-col justify-center py-5 gap-4 w-full">
            <div className="flex justify-between items-center w-full">
              <div className="font-semibold md:text-xl">
                <h2>Active Staffs</h2>
              </div>
              <div className="justify-end">
                <Button
                  color="primary"
                  className="w-[120px] bg-[#6236F5]"
                  onClick={handleAddStaff}
                >
                  +Add Staff
                </Button>
              </div>
            </div>
            {userData.length === 0 ? (
              <p>No valid data available</p>
            ) : (
              <Table aria-label="Staff table" removeWrapper>
                <TableHeader>
                  <TableColumn>Sl. no.</TableColumn>
                  <TableColumn>Staff ID</TableColumn>
                  <TableColumn>Name</TableColumn>
                  <TableColumn>Email</TableColumn>
                  <TableColumn>Service</TableColumn>
                  <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {userData.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.staffName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.service}</TableCell>
                      <TableCell>
                        <Button
                          color="primary"
                          size="mini"
                          className="ml-2"
                          onClick={() => handleEdit(user.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          color="error"
                          size="mini"
                          onClick={() => handleDelete(user.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staff;
