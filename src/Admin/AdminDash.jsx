// AdminDash.jsx
import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
} from "@nextui-org/react";
import Navbar from "./Navbar";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query, // Import query from Firestore
} from "firebase/firestore";
import { db } from "../firebase";
import ModalCounter from "./ModalCounter";

const AdminDash = () => {
  const [userData, setUserData] = useState([]);
  const [showModal, setShowModal] = useState(false);

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
  return (
    <div className="md:mx-64 mx-2 md:py-16 py-16 flex flex-col min-h-64">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap">
        <div className="flex flex-col items-center justify-center gap-10 w-full py-10">
          <ModalCounter />
        </div>
        <div className="flex flex-col items-center justify-center p-10 py-5 gap-4 w-full">
          <h2 className="font-semibold md:text-xl">Queue Details</h2>
          {userData.length === 0 ? (
            <p>No valid data available</p>
          ) : (
            <Table aria-label="Example static collection table">
              <TableHeader>
                <TableColumn>Sl. no.</TableColumn>
                <TableColumn>Name</TableColumn>
                <TableColumn>Phone</TableColumn>
                <TableColumn>Date</TableColumn>
                <TableColumn>Reason for Visit</TableColumn>
                <TableColumn>Counter</TableColumn>
              </TableHeader>
              <TableBody>
                {userData.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      {user.date
                        ? user.date.toDate().toLocaleString()
                        : ""}
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
    </div>
  );
};

export default AdminDash;
