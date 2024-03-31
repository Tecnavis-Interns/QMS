import React, { useState, useEffect } from "react";
import {
  Checkbox,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Button,
  Select,
  SelectItem,
  Button,
} from "@nextui-org/react";
import Navbar from "./Navbar";
import { collection, getDocs, onSnapshot, orderBy } from "firebase/firestore";
import { db, submitDataToFirestore } from "../firebase";

const CounterDash = () => {
  const [userData, setUserData] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState({});
  const [visitedUsers, setVisitedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "requests"), orderBy("date", "desc"));
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUserData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setError("Failed to fetch data. Please try again later.");
      }
    };

    fetchData();

    const unsubscribe = onSnapshot(collection(db, "requests"), (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const orderedData = updatedData.sort((a, b) => b.date - a.date);
      const reversedData = orderedData.reverse();
      setUserData(reversedData);
    });

    return () => unsubscribe(); // Unsubscribe when component unmounts
  }, []);


  const handleCounterChange = (event, userId) => {
    const counter = event.target.value;
    setSelectedCounter({ ...selectedCounter, [userId]: counter.toString() }); // Convert counter to string
  };


  const handleCheckboxChange = (event, userId) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      setVisitedUsers([...visitedUsers, userId]);
    } else {
      setVisitedUsers(visitedUsers.filter((id) => id !== userId));
    }
  };

  const handleSaveAllCounters = async () => {
    setSaving(true);
    try {
      const collectionName = 'responses'; // Specify the collection name
      // Filter out users with assigned counters
      const usersWithCounters = userData.filter(user => selectedCounter.hasOwnProperty(user.id));

      // Iterate over users with assigned counters
      for (const user of usersWithCounters) {
        // Ensure that 'id' property is defined
        if (!user.id) {
          console.error("Error: User ID is undefined");
          continue; // Skip this iteration and proceed to the next one
        }

        const counter = selectedCounter[user.id];

        // Log user object to check for required fields
        console.log("User Object:", user);

        // Check if all required fields are present
        if (!user.name || !user.phone || !user.service || !user.date || !counter) {
          console.error("Error: Required fields are missing for user:", user);
          continue; // Skip this iteration and proceed to the next one
        }

        // Prepare response object
        const response = {
          name: user.name,
          phone: user.phone,
          service: user.service,
          date: user.date.toDate(), // Convert Firestore timestamp to JavaScript Date object
          counter,
        };

        // Save response to specified collection in the database
        await submitDataToFirestore(collectionName, response);
        console.log("Response saved successfully.");
      }

      // Clear selectedCounter state after saving
      setSelectedCounter({});

      // Alert success message
      alert("All counters saved successfully.");
    } catch (error) {
      console.error("Error saving response: ", error);
      setError("Failed to save responses. Please try again later.");
    } finally {
      setSaving(false);
    }
  };




  return (
    <div className="md:mx-64 mx-2 md:py-10 py-5 flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap">
        <div className="flex flex-col items-center justify-center p-10 py-5 gap-4 w-full">
          <h2 className="font-semibold md:text-xl">Queue Details </h2>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <Table aria-label="Example static collection table">
              <TableHeader>
                <TableColumn>Sl. no.</TableColumn>
                <TableColumn>Name</TableColumn>
                <TableColumn>Date</TableColumn>
                <TableColumn>Phone</TableColumn>
                <TableColumn className="w-3/6">Reason for Visit</TableColumn>
                <TableColumn className="w-1/6">Counter</TableColumn>
                <TableColumn>Visited</TableColumn>
              </TableHeader>
              <TableBody>
                {userData.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.date.toDate().toLocaleString()}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.service}</TableCell>
                    <TableCell>
                      <Select
                        value={selectedCounter[user.id] || ""}
                        onChange={(event) => handleCounterChange(event, user.id)}
                        aria-label={`Select Counter for ${user.name}`}
                      >
                        <SelectItem value="">Not Assigned</SelectItem>
                        <SelectItem value="Counter 1">Counter 1</SelectItem>
                        <SelectItem value="Counter 2">Counter 2</SelectItem>
                        <SelectItem value="Counter 3">Counter 3</SelectItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={visitedUsers.includes(user.id)}
                        onChange={(event) => handleCheckboxChange(event, user.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={handleSaveAllCounters} disabled={Object.keys(selectedCounter).length === 0 || saving}>
              {saving ? "Saving..." : "Save All Counters"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterDash;
