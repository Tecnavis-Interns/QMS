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
} from "firebase/firestore";
import { db } from "../firebase";
import ModalCounter from "./ModalCounter";
import EditToken from "./EditToken";
import ManageCounterModal from "./ManageCounterModal"; // Import the ManageCounterModal component
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { Card, CardHeader, CardBody, CardFooter } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { FaSearch } from "react-icons/fa";
import { Button } from "@nextui-org/react";

const AdminDash = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  if (user === undefined) {
    navigate("/login");
  } else {
    const email = user?.email ?? undefined;
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
        const countersSnapshot = await getDocs(collection(db, "counter"));
        const countersData = countersSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((counter) => counter.counterName && counter.counterName.startsWith("Counter"));

        // Sort the counters based on the number after "Counter"
        const sortedCounters = countersData.sort((a, b) => {
          const getNumber = (counterName) => {
            const match = counterName.match(/\d+$/);
            return match ? parseInt(match[0], 10) : 0;
          };
          return getNumber(a.counterName) - getNumber(b.counterName);
        });

        setUserData(sortedCounters);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
    const unsubscribe = onSnapshot(collection(db, "counter"), (snapshot) => {
      const updatedCounters = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((counter) => counter.counterName && counter.counterName.startsWith("Counter"))
        .sort((a, b) => {
          const getNumber = (counterName) => {
            const match = counterName.match(/\d+$/);
            return match ? parseInt(match[0], 10) : 0;
          };
          return getNumber(a.counterName) - getNumber(b.counterName);
        });

      setUserData(updatedCounters);
    });

    return () => unsubscribe();
  }, []);

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
            <div className="flex flex-col items-center gap-1">
              <ModalCounter />
            </div>
            <div className="flex flex-col items-center gap-10">
              <ManageCounterModal />
            </div>
            <div className="flex flex-col items-center gap-10">
              <EditToken />
            </div>
          </div>
          <div className="flex flex-col justify-center py-5 gap-4 w-full">
            <div className="flex justify-between items-center w-full">
              <div className="font-semibold md:text-xl">
                <h2>Active Counters</h2>
              </div>
              {/* <div className="justify-end">
                <Button color="primary" className="w-[120px] bg-[#6236F5]" onClick={handleCloseModal}>
                  Filter
                </Button>
              </div> */}
            </div>
            {userData.length === 0 ? (
              <p>No valid data available</p>
            ) : (
              <Table aria-label="Example static collection table" removeWrapper>
                <TableHeader>
                  <TableColumn className="w-1/2">Sl. no.</TableColumn>
                  <TableColumn>Counter Name</TableColumn>
                </TableHeader>
                <TableBody>
                  {userData.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{user.counterName}</TableCell>
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
    </div>
  );
};

export default AdminDash;
