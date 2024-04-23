import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import Navbar from "./Navbar";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import ModalCounter from "./ModalCounter";
import EditToken from "./EditToken";
import ManageCounterModal from "./ManageCounterModal"; // Import the ManageCounterModal component
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";

const AdminDash = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  if (user === undefined) {
    navigate("/login");
  } else {
    const email = user?.email ?? undefined
    if (email !== "admin@tecnavis.com") {
      navigate("/login");
    }
  }
  const [userData, setUserData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCounter, setSelectedCounter] = useState(null); // State to manage selected counter data

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(
          query(collection(db, "requests"), orderBy("date", "asc"))
        );
        const data = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => isValidUserData(user));
        setUserData(data);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
    const unsubscribe = onSnapshot(
      query(collection(db, "requests"), orderBy("date", "asc")),
      (snapshot) => {
        const updatedData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => isValidUserData(user));
        setUserData(updatedData);
      }
    );

    return () => unsubscribe();
  }, []);

  const isValidUserData = (user) => {
    return (
      user.name &&
      user.date &&
      user.phone &&
      user.service &&
      user.counter &&
      user.token
    );
  };

  const handleAddCounter = () => {
    setShowModal(true);
  };

  const handleManageCounter = (counter) => {
    setSelectedCounter(counter);
  };

  const handleCloseModal = () => {
    setSelectedCounter(null);
  };

  return (
    <div className=" flex flex-col min-h-screen">
      <Navbar />
      <div className="md:mx-64 mx-2 md:py-16 py-16 flex justify-center flex-wrap gap-10">
        <div className="flex items-center justify-center gap-10 w-full py-10">
          <div className="flex flex-col items-center gap-10">
            <ModalCounter />
          </div>
          <div className="flex flex-col items-center gap-10">
            <ManageCounterModal />
          </div>
          <div className="flex flex-col items-center gap-10">
            <EditToken />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-10 py-5 gap-4 w-full">
          <h2 className="font-semibold md:text-xl">Queue Details</h2>
          {userData.length === 0 ? (
            <p>No valid data available</p>
          ) : (
            <Table aria-label="Example static collection table" removeWrapper>
              <TableHeader>
                <TableColumn>Sl. no.</TableColumn>
                <TableColumn>Name</TableColumn>
                <TableColumn>Phone</TableColumn>
                <TableColumn>Date</TableColumn>
                <TableColumn>Reason for Visit</TableColumn>
                <TableColumn className="w-1/6">Counter</TableColumn>
              </TableHeader>
              <TableBody>
                {userData.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      {user.date ? user.date.toDate().toLocaleString() : ""}
                    </TableCell>
                    <TableCell>{user.service}</TableCell>
                    <TableCell>{user.counter}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      {/* Render ManageCounterModal component */}
      {selectedCounter && (
        <ManageCounterModal
          isOpen={true} // Always open when a counter is selected
          onClose={handleCloseModal}
          counterData={selectedCounter}
        />
      )}
    </div>
  );
};

export default AdminDash;
