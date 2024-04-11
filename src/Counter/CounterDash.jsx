import { useState, useEffect } from "react";
import {
  Checkbox,
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
  query,
  where,
  deleteDoc,
  setDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

const CounterDash = () => {
  const [userData, setUserData] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, "requests"),
          orderBy("date", "desc")
        );
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserData(data.filter(isValidUserData)); // Filter out invalid data
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();

    const unsubscribe = onSnapshot(collection(db, "requests"), (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => doc.data());
      const orderedData = updatedData.sort((a, b) => b.date - a.date);
      const reversedData = orderedData.reverse();
      setUserData(reversedData.filter(isValidUserData)); // Filter out invalid data
    });

    return () => unsubscribe(); // Unsubscribe when component unmounts
  }, []);

  const isValidUserData = (user) => {
    return (
      user.name &&
      user.phone &&
      user.date &&
      user.service &&
      user.token
    );
  };

  const handleCheckboxChange = (event, userId) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      setSelectedRecords((prevSelected) => [...prevSelected, userId]);
    } else {
      setSelectedRecords((prevSelected) =>
        prevSelected.filter((id) => id !== userId)
      );
    }
  };

  const handleSaveButtonClick = async () => {
    for (const userId of selectedRecords) {
      await moveRecordToVisited(userId);
    }
    setSelectedRecords([]); // Clear selected records after deletion
  };

  const moveRecordToVisited = async (userId) => {
    try {
      const q = query(collection(db, "requests"), where("id", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        // Add the document to the 'visited' collection
        await setDoc(doc(collection(db, "visited"), userId), userData);

        // Delete the document from the 'requests' collection
        await deleteDoc(querySnapshot.docs[0].ref);

        console.log("Record moved to 'visited' collection successfully.");
      } else {
        console.warn("Document with id", userId, "not found.");
      }
    } catch (error) {
      console.error("Error moving record to 'visited' collection: ", error);
    }
  };

  return (
    <div className="md:mx-64 mx-2 md:py-10 py-5 flex flex-col min-h-dvh">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap">
        <div className="flex flex-col items-center justify-center p-10 py-5 gap-4 w-full">
          <h2 className="font-semibold md:text-xl">Queue Details </h2>
          <Table aria-label="Example static collection table">
            <TableHeader>
              <TableColumn>Sl. no.</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Phone</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Reason for Visit</TableColumn>
              <TableColumn>Token No</TableColumn>
              <TableColumn>Visited</TableColumn>
            </TableHeader>
            <TableBody>
              {userData.map((user, index) => {
                return (
                  <TableRow key={user.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      {user.date ? user.date.toDate().toLocaleString() : ""}
                    </TableCell>
                    <TableCell>{user.service}</TableCell>
                    <TableCell>{user.token}</TableCell>
                    <TableCell>
                      <Checkbox
                        onChange={(event) =>
                          handleCheckboxChange(event, user.id)
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Button onClick={handleSaveButtonClick}>Save</Button>
        </div>
      </div>
    </div>
  );
};

export default CounterDash;
