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
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";

const CounterDash = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  // State variables
  const [userData, setUserData] = useState([]); // Stores user data
  const [selectedRecords, setSelectedRecords] = useState([]); // Stores selected records
  const [currentDate, setCurrentDate] = useState(""); // Stores current date
  const [completedCount, setCompletedCount] = useState(0); // Stores count of completed records
  const [pendingCount, setPendingCount] = useState("-"); // Stores count of pending records
  const [nextTokenIndex, setNextTokenIndex] = useState(null); // Stores index of next token to be served
  const [isServiceStarted, setIsServiceStarted] = useState(false); // Flag to indicate if service is started
  const [nowServingToken, setNowServingToken] = useState(""); // Stores currently serving token

  // Fetch and set initial user data
  useEffect(() => {
    const checkUser = async () => {
      if (!user) {
        navigate("/login");
        return;
      }

      const email = user.email;
      const counterName = email.split("@")[0];
      const counterNumber = parseInt(counterName.replace("counter", ""));

      if (isNaN(counterNumber) || counterNumber < 1 || counterNumber > 5) {
        navigate("/login");
        return;
      }

      const fetchData = async () => {
        try {
          const collectionName = `Counter ${counterNumber}`;
          const querySnapshot = await getDocs(
            collection(db, collectionName),
            orderBy("date", "desc")
          );
          const data = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setUserData(data.filter(isValidUserData));
        } catch (error) {
          console.error("Error fetching data: ", error);
        }
      };

      fetchData();

      const unsubscribe = onSnapshot(
        collection(db, `Counter ${counterNumber}`),
        (snapshot) => {
          const updatedData = snapshot.docs.map((doc) => doc.data());
          const orderedData = updatedData.sort((a, b) => b.date - a.date);
          const reversedData = orderedData.reverse();
          setUserData(reversedData.filter(isValidUserData));
        }
      );

      return () => unsubscribe();
    };

    checkUser();
  }, [user]);

  // Function to validate user data
  const isValidUserData = (user) => {
    return user.name && user.phone && user.date && user.service && user.token;
  };

  // Move record to pending collection
  const handlePendingButtonClick = async () => {
    if (nextTokenIndex > 0 && nextTokenIndex <= userData.length) {
      const servingTokenIndex = nextTokenIndex - 1;
      await moveRecordToPending(userData[servingTokenIndex].id);
    } else {
      console.log("No token currently being served.");
    }
  };

  // Function to move a record to the pending collection
  const moveRecordToPending = async (userId) => {
    try {
      const email = user.email;
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const pendingCollectionName = `PendingCounter${counterNumber}`;

      const q = query(
        collection(db, getCurrentCounterCollectionName()),
        where("id", "==", userId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        await setDoc(doc(collection(db, pendingCollectionName), userId), userData);
        await deleteDoc(querySnapshot.docs[0].ref);

        console.log("Record moved to 'pending' collection successfully.");
      } else {
        console.warn(
          "Document with id",
          userId,
          "not found in current counter's collection."
        );
      }
    } catch (error) {
      console.error("Error moving record to 'pending' collection: ", error);
    }
  };

  // Fetch pending count
  const fetchPendingCount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log("User not authenticated");
        return;
      }

      const email = user.email;
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const pendingCollectionName = `PendingCounter${counterNumber}`;
      const pendingSnapshot = await getDocs(collection(db, pendingCollectionName));
      setPendingCount(pendingSnapshot.size);
    } catch (error) {
      console.error("Error fetching pending count: ", error);
    }
  };

  fetchPendingCount();

  // Recall a pending record
  const handleRecallButtonClick = async () => {
    try {
      const email = user.email;
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const pendingCollectionName = `PendingCounter${counterNumber}`;

      const querySnapshot = await getDocs(collection(db, pendingCollectionName));
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        await setDoc(
          doc(collection(db, getCurrentCounterCollectionName()), userData.id),
          userData
        );
        await deleteDoc(querySnapshot.docs[0].ref);

        fetchPendingCount();

        console.log("Record recalled successfully.");
      } else {
        console.warn("No pending records found to recall.");
      }
    } catch (error) {
      console.error("Error recalling record: ", error);
    }
  };

  // Function to speak a message
  const speak = (message) => {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    speechSynthesis.speak(utterance);
  };

  // Handle call button click
  const handleCallButtonClick = async () => {
    const email = user.email;
    const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
    try {
      if (nextTokenIndex > 0 && userData.length >= nextTokenIndex) {
        const currentlyServingToken = userData[nextTokenIndex - 1].token;
        console.log(`Calling token ${currentlyServingToken}`);
        const tokenData = {
          token: currentlyServingToken
        };
        await updateCurrentlyServing(tokenData);
        const message = `${currentlyServingToken} PLEASE PROCEED TO COUNTER${counterNumber}`;
        speak(message);
        await storeNextTokenData(userData[nextTokenIndex]);
      } else {
        console.log("No more tokens in queue");
      }
    } catch (error) {
      console.error("Error calling token: ", error);
    }
  };

  // Handle call now button click
  const handleCallNowButtonClick = async (index) => {
    try {
      const email = user.email;
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const currentIndex = index;
      const tokenData = {
        token: userData[currentIndex].token
      };

      await updateCurrentlyServing(tokenData);

      const newUserData = [
        userData[currentIndex],
        ...userData.slice(0, currentIndex),
        ...userData.slice(currentIndex + 1)
      ];

      setUserData(newUserData);
      await storeNextTokenData(userData[0]);

      const message = `${tokenData.token} PLEASE PROCEED TO COUNTER${counterNumber}`;
      speak(message);
    } catch (error) {
      console.error("Error calling token: ", error);
    }
  };

  // Update currently serving token in the database
  const updateCurrentlyServing = async (tokenData) => {
    try {
      const email = user.email;
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const servingCollectionName = `CurrentlyServingCounter${counterNumber}`;

      const querySnapshot = await getDocs(collection(db, servingCollectionName));
      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        await setDoc(doc(collection(db, servingCollectionName), docId), tokenData);
      } else {
        await setDoc(doc(collection(db, servingCollectionName)), tokenData);
      }
      console.log("Currently serving token updated successfully.");
    } catch (error) {
      console.error("Error updating currently serving token: ", error);
    }
  };

  // Store next token data in the database
  const storeNextTokenData = async (tokenData) => {
    try {
      const email = user.email;
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const nextTokenCollectionName = `nextTokenCounter${counterNumber}`;

      if (tokenData) {
        const querySnapshot = await getDocs(collection(db, nextTokenCollectionName));
        if (!querySnapshot.empty) {
          const docId = querySnapshot.docs[0].id;
          await setDoc(doc(collection(db, nextTokenCollectionName), docId), tokenData);
        } else {
          await setDoc(doc(collection(db, nextTokenCollectionName)), tokenData);
        }
        console.log("Next token data stored successfully.");
      }
    } catch (error) {
      console.error("Error storing next token data: ", error);
    }
  };

  // Update token counter in the database
  const updateTokenCounter = async (counterNumber) => {
    const tokenCounterDocRef = doc(db, "tokenCounter", `counter${counterNumber}`);
    await setDoc(tokenCounterDocRef, {
      tokenCounter: nextTokenIndex
    });
  };

  // Get the current counter's collection name
  const getCurrentCounterCollectionName = () => {
    const email = user.email;
    const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
    return `Counter ${counterNumber}`;
  };

  // Handle end service button click
  const handleEndServiceButtonClick = async () => {
    const email = user.email;
    const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
    try {
      const currentlyServingCollection = collection(
        db,
        `CurrentlyServingCounter${counterNumber}`
      );

      const querySnapshot = await getDocs(currentlyServingCollection);

      if (!querySnapshot.empty) {
        const currentlyServingDoc = querySnapshot.docs[0];
        await deleteDoc(currentlyServingDoc.ref);
      }

      setIsServiceStarted(false);
      setNowServingToken("-");
      setNextTokenIndex(null);

      console.log("Service ended successfully.");
    } catch (error) {
      console.error("Error ending service: ", error);
    }
  };

  // Handle start service button click
  const handleStartServiceButtonClick = async () => {
    const email = user.email;
    const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
    try {
      const tokenCounterRef = doc(db, "tokenCounter", `counter${counterNumber}`);
      const tokenCounterDoc = await getDoc(tokenCounterRef);

      let nextToken = 1;

      if (tokenCounterDoc.exists()) {
        const tokenCounterData = tokenCounterDoc.data();
        nextToken = tokenCounterData.tokenCounter + 1;
      }

      setIsServiceStarted(true);
      setNextTokenIndex(nextToken);
      console.log("Service started successfully.");
    } catch (error) {
      console.error("Error starting service: ", error);
    }
  };

  // Get current date in desired format
  const getCurrentDate = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Set the current date on component mount
  useEffect(() => {
    const date = getCurrentDate();
    setCurrentDate(date);
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Card style={{ width: "80%", margin: "20px", maxWidth: "1000px" }}>
          <CardHeader>
            <h1>Counter Dashboard</h1>
          </CardHeader>
          <CardBody>
            <Table
              aria-label="User Data Table"
              style={{ minWidth: "650px" }}
              selectionMode="multiple"
              onSelectionChange={setSelectedRecords}
              selectedKeys={selectedRecords}
            >
              <TableHeader>
                <TableColumn>Name</TableColumn>
                <TableColumn>Phone</TableColumn>
                <TableColumn>Date</TableColumn>
                <TableColumn>Service</TableColumn>
                <TableColumn>Token</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody>
                {userData.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.date}</TableCell>
                    <TableCell>{user.service}</TableCell>
                    <TableCell>{user.token}</TableCell>
                    <TableCell>
                      <Button onClick={() => handleCallNowButtonClick(index)}>
                        Call Now
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
          <CardFooter>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <Button onClick={handleCallButtonClick}>Call Next</Button>
              <Button onClick={handlePendingButtonClick}>Move to Pending</Button>
              <Button onClick={handleRecallButtonClick}>Recall</Button>
              <Button
                color={isServiceStarted ? "error" : "primary"}
                onClick={isServiceStarted ? handleEndServiceButtonClick : handleStartServiceButtonClick}
              >
                {isServiceStarted ? "End Service" : "Start Service"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default CounterDash;
