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

  // New state variable to track completed count
  const [completedCount, setCompletedCount] = useState(0);

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

  const [userData, setUserData] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [currentDate, setCurrentDate] = useState("");

  // Function to get the current date in the desired format
  const getCurrentDate = () => {
    const dateObj = new Date();
    const month = dateObj.toLocaleString("default", { month: "long" });
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  // Set the current date
  useEffect(() => {
    setCurrentDate(getCurrentDate());
  }, []);

  const isValidUserData = (user) => {
    return (
      user.name && user.phone && user.date && user.service && user.token
    );
  };

  const handleCheckboxChange = async (event, userId) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      // Add userId to selectedRecords
      setSelectedRecords((prevSelected) => [...prevSelected, userId]);
    } else {
      // Remove userId from selectedRecords
      setSelectedRecords((prevSelected) =>
        prevSelected.filter((id) => id !== userId)
      );
    }
  };

  const handleSaveButtonClick = async () => {
    for (const userId of selectedRecords) {
      await moveRecordToVisited(userId);
    }
    setSelectedRecords([]); // Clear selected records after moving
  };

  const moveRecordToVisited = async (userId) => {
    try {
      const q = query(collection(db, `Counter ${counterNumber}`), where("token", "==", userId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        // Add the document to the 'visited' collection
        await setDoc(doc(collection(db, "visitor"), userId), userData);

        // Delete the document from the 'Counter X' collection
        await deleteDoc(querySnapshot.docs[0].ref);

        // Increment completed count
        setCompletedCount((prevCount) => prevCount + 1);

        console.log("Record moved to 'visitor' collection successfully.");
      } else {
        console.warn("Document with token number", userId, "not found in 'Counter' collection.");
      }
    } catch (error) {
      console.error("Error moving record to 'visitor' collection: ", error);
    }
  };

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
                {/* Display total customer count */}
                <p>{userData.length}</p>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h3 className="font-bold text-large">Next Token</h3>
                {/* Display next token number */}
                <p>{userData.length > 0 ? userData[1].token : '-'}</p>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h3 className="font-bold text-large">Completed</h3>
                {/* Display completed count */}
                <p>{completedCount}</p>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
              </CardBody>
            </Card>
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h3 className="font-bold text-large">Pending</h3>
                {/* Display pending count */}
                <p>{userData.length > 0 ? userData.length - completedCount : '-'}</p>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
              </CardBody>
            </Card>
          </div>
          <div className="grid grid-cols-1 mb-4 mt-12">
            <Card className="py-4 ml-4 w-[200px]">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h3 className="font-bold text-large mb-21">Now Serving</h3>
                <p>{userData.length > 0 ? userData[0].token : '-'}</p>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <div className="flex flex-col items-center justify-end h-full">
                  <div className="flex justify-end mb-4">
                    <Button onClick={handleSaveButtonClick} className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3 w-32">
                      Completed
                    </Button>
                  </div>
                  <div className="flex justify-end mb-0">
                    <Button className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3 w-32">
                      Pending
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          <div className="mb-2 mt-12 ml-9">
            <div className="flex justify-end mb-5">
              <Button className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3">
                Next
              </Button>
            </div>
            <div className="flex justify-end mb-5">
              <Button className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3">
                Call
              </Button>
            </div>
            <div className="flex justify-end mb-5">
              <Button className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3">
                Recall
              </Button>
            </div>
            <div className="flex justify-end mb-5">
              <Button className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3">
                Start
              </Button>
            </div>
            <div className="flex justify-end mb-5">
              <Button className="bg-[#6236F5] p-2 px-5 rounded-md text-white w-fit mt-3">
                Close
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-10 py-5 gap-10 w-full">
            <Table aria-label="Example static collection table" removeWrapper>
              <TableHeader>
                <TableColumn>Sl. no.</TableColumn>
                <TableColumn>Name</TableColumn>
                <TableColumn>Phone</TableColumn>
                <TableColumn>Date</TableColumn>
                <TableColumn>Reason for Visit</TableColumn>
                <TableColumn>Token No</TableColumn>
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
