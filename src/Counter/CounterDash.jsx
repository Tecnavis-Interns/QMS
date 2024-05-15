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

  const [userData, setUserData] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [currentDate, setCurrentDate] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState("-");
  const [nextTokenIndex, setNextTokenIndex] = useState(null); // Initialize to null
  const [isServiceStarted, setIsServiceStarted] = useState(false); // Initialize to false
  const [nowServingToken, setNowServingToken] = useState("");

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
          setUserData(data.filter(isValidUserData)); // Filter out invalid data
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
          setUserData(reversedData.filter(isValidUserData)); // Filter out invalid data
        }
      );

      return () => unsubscribe(); // Unsubscribe when component unmounts
    };

    checkUser();
  }, [user]);

  const isValidUserData = (user) => {
    return (
      user.name &&
      user.phone &&
      user.date &&
      user.service &&
      user.token
    );
  };

  const handlePendingButtonClick = async () => {
    if (nextTokenIndex > 0 && nextTokenIndex <= userData.length) {
      const servingTokenIndex = nextTokenIndex - 1; // Get the index of the token being served
      await moveRecordToPending(userData[servingTokenIndex].id); // Move record to Pending when pending button is clicked
    } else {
      console.log("No token currently being served.");
    }
  };

  const moveRecordToPending = async (userId) => {
    try {
      const email = user.email;
      const counterNumber = parseInt(
        email.split("@")[0].replace("counter", "")
      );
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
  const fetchPendingCount = async () => {
    try {
      const user = auth.currentUser; // Get the current user
      if (!user) {
        console.log("User not authenticated");
        return;
      }

      const email = user.email;
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const pendingCollectionName = `PendingCounter${counterNumber}`;
      const pendingSnapshot = await getDocs(collection(db, pendingCollectionName));
      setPendingCount(pendingSnapshot.size); // Update pending count
    } catch (error) {
      console.error("Error fetching pending count: ", error);
    }
  };

  fetchPendingCount();

  const handleRecallButtonClick = async () => {
    try {
      const email = user.email;
      const counterNumber = parseInt(
        email.split("@")[0].replace("counter", "")
      );
      const pendingCollectionName = `PendingCounter${counterNumber}`;

      const querySnapshot = await getDocs(
        collection(db, pendingCollectionName)
      );
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        await setDoc(
          doc(collection(db, getCurrentCounterCollectionName()), userData.id),
          userData
        );
        await deleteDoc(querySnapshot.docs[0].ref);

        // Update pending count after recalling
        fetchPendingCount();

        console.log("Record recalled successfully.");
      } else {
        console.warn("No pending records found to recall.");
      }
    } catch (error) {
      console.error("Error recalling record: ", error);
    }
  };

  const handleStartButtonClick = async () => {
    if (!isServiceStarted) {
      setIsServiceStarted(true); // Start the service
    }
    if (userData.length > nextTokenIndex || nextTokenIndex === null) {
      // Check if the previous token has been served
      if (nextTokenIndex === null || nextTokenIndex === 0 || userData[nextTokenIndex - 1].visited) {
        const newNextTokenIndex = nextTokenIndex === null ? 0 : nextTokenIndex;
        setNextTokenIndex(newNextTokenIndex + 1);
        console.log(`Next token is ${userData[newNextTokenIndex].token}`);

        // Update the currently serving token in the database
        const tokenData = {
          token: userData[newNextTokenIndex].token
        };
        await updateCurrentlyServing(tokenData);
      } else {
        console.log("Previous token has not been served yet.");
      }
    } else {
      console.log("No more tokens in queue");
    }
  };

  const handleCallButtonClick = async () => {
    const email = user.email;
    const counterNumber = parseInt(
      email.split("@")[0].replace("counter", "")
    );
    try {
      // Check if there is a token currently being served
      if (nextTokenIndex > 0 && userData.length >= nextTokenIndex) {
        const currentlyServingToken = userData[nextTokenIndex - 1].token;
        console.log(`Calling token ${currentlyServingToken}`);
        // Update the currently serving token in the database
        const tokenData = {
          token: currentlyServingToken
        };
        await updateCurrentlyServing(tokenData);
        const message = `${currentlyServingToken} PLEASE PROCEED TO COUNTER${counterNumber}`;
        console.log(tokenData)
        speak(message)
      } else {
        console.log("No more tokens in queue");
      }
    } catch (error) {
      console.error("Error calling token: ", error);
    }
  };

  const speak = (message) => {
    const speechSynthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    speechSynthesis.speak(utterance);
  }


  const updateCurrentlyServing = async (tokenData) => {
    try {
      const email = user.email;
      const counterNumber = parseInt(
        email.split("@")[0].replace("counter", "")
      );
      const servingCollectionName = `CurrentlyServingCounter${counterNumber}`;

      // Get the current serving document
      const querySnapshot = await getDocs(collection(db, servingCollectionName));
      if (!querySnapshot.empty) {
        // If document exists, update it
        const docId = querySnapshot.docs[0].id;
        await setDoc(doc(collection(db, servingCollectionName), docId), tokenData);
      } else {
        // If document doesn't exist, create a new one
        await setDoc(doc(collection(db, servingCollectionName)), tokenData);
      }
      console.log("Currently serving token updated successfully.");
    } catch (error) {
      console.error("Error updating currently serving token: ", error);
    }
  };

  const handleResetButtonClick = async () => {
    try {
      const email = user.email;
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const counterCollectionName = `Counter ${counterNumber}`;

      // Reference to the counter collection
      const counterCollectionRef = doc(db, "counter", counterCollectionName);

      // Delete the entire collection
      await deleteDoc(counterCollectionRef);

      console.log(`Collection '${counterCollectionName}' deleted successfully.`);
    } catch (error) {
      console.error("Error deleting collection: ", error);
    }
  };


  const handleSaveButtonClick = async () => {
    if (nextTokenIndex > 0 && nextTokenIndex <= userData.length) {
      const servingTokenIndex = nextTokenIndex - 1; // Get the index of the token being served
      await moveRecordToVisited(userData[servingTokenIndex].id); // Move record to visited when completed button is clicked
      await deleteCurrentlyServingDoc(); //delete currently serving token
    } else {
      console.log("No token currently being served.");
    }
  };

  const deleteCurrentlyServingDoc = async () => {
    try {
      const email = user.email;
      const counterNumber = parseInt(email.split("@")[0].replace("counter", ""));
      const servingCollectionName = `CurrentlyServingCounter${counterNumber}`;

      const querySnapshot = await getDocs(collection(db, servingCollectionName));
      if (!querySnapshot.empty) {
        await deleteDoc(querySnapshot.docs[0].ref);
        console.log("Currently serving document deleted successfully.");
      } else {
        console.warn("No currently serving document found.");
      }
    } catch (error) {
      console.error("Error deleting currently serving document: ", error);
    }
  };

  const moveRecordToVisited = async (userId) => {
    try {
      // Define collectionName within the function scope
      const collectionName = getCurrentCounterCollectionName();
      const q = query(
        collection(db, collectionName),
        where("id", "==", userId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        // Add the document to the 'visited' collection
        await setDoc(doc(collection(db, "visited"), userId), userData);
        await setDoc(
          doc(collection(db, `${collectionName}Visited`), userId),
          userData
        );

        // Delete the document from the 'Counter X' collection
        await deleteDoc(querySnapshot.docs[0].ref);

        // Increment completed count
        setCompletedCount((prevCount) => prevCount + 1);

        console.log("Record moved to 'visited' collection successfully.");
      } else {
        console.warn("Document with id", userId, "not found in 'Counter' collection.");
      }
    } catch (error) {
      console.error("Error moving record to 'visited' collection: ", error);
    }
  };

  const getCurrentCounterCollectionName = () => {
    const email = user.email;
    return `Counter ${parseInt(email.split("@")[0].replace("counter", ""))}`;
  };

  const getCurrentDate = () => {
    const dateObj = new Date();
    const month = dateObj.toLocaleString("default", { month: "long" });
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  useEffect(() => {
    setCurrentDate(getCurrentDate());
  }, [user, completedCount]);

  return (
    <div className="flex">
      <div className="fixed top-0 left-0 bottom-0">
        <Navbar />
      </div>
      <div className="flex-1 ml-60">
        <div className="flex flex-1 justify-center flex-wrap lg:mx-24">
          <div className="mb-4 mt-4">
            <h1>Date : {currentDate} </h1>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4 mt-12 mr-5">
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h3 className="font-bold text-large">Total Customer</h3>
                <p className="font-bold text-large ">{userData.length}</p>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-center">
                <h3 className="font-bold text-large">Next Token</h3>
                {isServiceStarted ? (
                  <p>{userData.length > nextTokenIndex ? userData[nextTokenIndex].token : '-'}</p>
                ) : (
                  <p>-</p>
                )}
              </CardHeader>
              <CardBody className="overflow-visible py-2">
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h3 className="font-bold text-large">Completed</h3>
                <p>{completedCount}</p>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-center">
                <h3 className="font-bold text-large">Pending</h3>
                <p>{pendingCount}</p>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
              </CardBody>
            </Card>
          </div>
          <div className="grid grid-cols-1 mb-4 mt-12">
            <Card className="py-4 ml-4 w-[200px]">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-center">
                <h3 className="font-bold text-large mb-21">Now Serving</h3>
                {isServiceStarted && nextTokenIndex > 0 && (
                  <p>{userData.length > 0 ? userData[nextTokenIndex - 1].token : "-"}</p>
                )}
              </CardHeader>
              {isServiceStarted && nextTokenIndex > 0 && (
                <CardBody className="overflow-visible py-2">
                  <div className="flex flex-col items-center justify-end h-full">
                    <div className="flex justify-end mb-4">
                      <Button
                        onClick={handleSaveButtonClick}
                        className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3 w-32"
                      >
                        Completed
                      </Button>
                    </div>
                    <div className="flex justify-end mb-0">
                      <Button
                        onClick={handlePendingButtonClick}
                        className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3 w-32"
                      >
                        Pending
                      </Button>
                    </div>
                  </div>
                </CardBody>
              )}
            </Card>

          </div>
          <div className="mb-2 mt-12 ml-9">
            <div className="flex justify-end mb-5">
              <Button onClick={handleStartButtonClick} className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3">
                Start
              </Button>
            </div>
            <div className="flex justify-end mb-5">
              <Button onClick={handleCallButtonClick} className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3">
                Call
              </Button>
            </div>
            <div className="flex justify-end mb-5">
              <Button onClick={handleRecallButtonClick} className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3">
                Recall
              </Button>
            </div>
            <div className="flex justify-end mb-5">
              <Button onClick={handleResetButtonClick} className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3">
                Reset Token
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-10 py-5 gap-10 w-full">
            <Table aria-label="Example static collection table" removeWrapper>
              <TableHeader >
                <TableColumn>Sl. no.</TableColumn>
                <TableColumn>Name</TableColumn>
                <TableColumn>Phone</TableColumn>
                <TableColumn>Date</TableColumn>
                <TableColumn>Reason for Visit</TableColumn>
                <TableColumn>Token No</TableColumn>
                <TableColumn></TableColumn>
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
                        <Button
                          onClick={() => setNowServingToken(user.token)}
                          className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3"
                        >
                          Call
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CounterDash;
