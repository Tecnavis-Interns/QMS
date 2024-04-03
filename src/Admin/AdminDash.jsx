// AdminDash.jsx
import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Button,
} from "@nextui-org/react";
import Navbar from "./Navbar";
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import ModalCounter from "./ModalCounter";

const AdminDash = () => {
  const [userData, setUserData] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "requests"));
        const data = querySnapshot.docs.map((doc) => doc.data());
        setUserData(data);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
    const unsubscribe = onSnapshot(collection(db, "requests"), (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => doc.data());
      setUserData(updatedData);
    });

    return () => unsubscribe(); // Unsubscribe when component unmounts
  }, []);

  const handleCounterChange = (event, userId) => {
    const counter = event.target.value;
    setSelectedCounter({ ...selectedCounter, [userId]: counter });
  };

  const handleSaveAllCounters = async () => {
    // Save all selected counters to the database
    for (const userId in selectedCounter) {
      await handleSaveCounter(userId);
    }
  };

  const handleSaveCounter = async (userId) => {
    const counter = selectedCounter[userId];
    if (counter) {
      try {
        // Create a query to find the document where the id field matches the userId
        const q = query(collection(db, "requests"), where("id", "==", userId));
        const querySnapshot = await getDocs(q);

        // Check if a document with the specified userId exists
        if (!querySnapshot.empty) {
          // If a document exists, update the counter field
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, { counter: counter });
          console.log("Counter saved successfully.");
          alert("Counter saved successfully.");
        } else {
          console.warn("Document with id", userId, "not found.");
        }
      } catch (error) {
        console.error("Error saving counter: ", error);
      }
    } else {
      console.warn("No counter selected.");
    }
  };

  return (
    <div className="md:mx-64 mx-2 md:py-10 py-5 flex flex-col min-h-dvh">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap">
        <div className="flex flex-col items-center justify-center gap-5 w-full">
          <ModalCounter />
          <h2 className="font-semibold md:text-xl">Queue Details </h2>
          <div className="overflow-auto w-full min-h-64 max-h-64 flex items-center flex-col gap-5">
            <Table
              aria-label="Example static collection table"
              removeWrapper
              isHeaderSticky
            >
              <TableHeader>
                <TableColumn>Sl. no.</TableColumn>
                <TableColumn>Name</TableColumn>
                <TableColumn>Date</TableColumn>
                <TableColumn>Phone</TableColumn>
                <TableColumn>Reason for Visit</TableColumn>
                <TableColumn>Select Counter</TableColumn>
              </TableHeader>
              <TableBody>
                {userData.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}.</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      {user.date
                        ? new Date(user.date.seconds * 1000).toLocaleString()
                        : ""}
                    </TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.service}</TableCell>
                    <TableCell>
                      <Select
                        label="select counter"
                        value={selectedCounter[user.id] ||""}
                        defaultSelectedKeys={[`${user.counter}`]}
                        onChange={(event) =>
                          handleCounterChange(event, user.id)
                        }
                      >
                        <SelectItem value="counter 1" key="counter 1">
                          Counter 1
                        </SelectItem>
                        <SelectItem value="counter 2" key="counter 2">
                          Counter 2
                        </SelectItem>
                        <SelectItem value="counter 3" key="counter 3">
                          Counter 3
                        </SelectItem>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleSaveAllCounters}
                disabled={Object.keys(selectedCounter).length === 0}
              >
                Save All Counters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDash;
