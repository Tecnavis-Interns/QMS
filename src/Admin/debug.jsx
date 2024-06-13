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
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { Input } from "@nextui-org/input";
import { FaSearch } from "react-icons/fa";

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

  const [countersData, setCountersData] = useState([]);

  useEffect(() => {
    const fetchCountersData = async () => {
      try {
        const countersSnapshot = await getDocs(collection(db, "counter"));
        const countersData = countersSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((counter) => counter.counterName && counter.counterName.startsWith("Counter"));
        setCountersData(countersData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchCountersData();

    const unsubscribeCounters = onSnapshot(collection(db, "counter"), (snapshot) => {
      const updatedCounters = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((counter) => counter.counterName && counter.counterName.startsWith("Counter"));
      setCountersData(updatedCounters);
    });

    return () => {
      unsubscribeCounters();
    };
  }, []);

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
          <div className="flex flex-col justify-center py-5 gap-4 w-full">
            <div className="flex justify-between items-center w-full">
              <div className="font-semibold md:text-xl">
                <h2>Active Counters</h2>
              </div>
            </div>
            {countersData.length === 0 ? (
              <p>No counters available</p>
            ) : (
              <Table aria-label="Counters table" removeWrapper>
                <TableHeader>
                  <TableColumn>Sl. no.</TableColumn>
                  <TableColumn>Counter Name</TableColumn>
                </TableHeader>
                <TableBody>
                  {countersData.map((counter, index) => (
                    <TableRow key={counter.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{counter.counterName}</TableCell>
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

export default AdminDash;
