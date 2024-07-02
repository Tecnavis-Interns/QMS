import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Card,
  CardBody
} from "@nextui-org/react";
// import Navbar from "../Components/Navbar";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function UserForm() {
  const [countersData, setCountersData] = useState([]);

  const fetchData = async () => {
    try {
      const counterNames = ["Counter 1", "Counter 2", "Counter 3", "Counter 4", "Counter 5"];
      const countersData = [];
      for (const counterName of counterNames) {
        const querySnapshot = await getDocs(collection(db, counterName));
        const counterTokens = querySnapshot.docs.map((doc) => doc.data().token);
        countersData.push({ counterName, tokens: counterTokens });
      }
      setCountersData(countersData);
    } catch (error) {
      console.error("Error fetching counters: ", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-dvh">
      {/* <Navbar /> */}
      <div className="flex flex-1 justify-center flex-wrap lg:mx-10">
        {countersData.map((counter, index) => (
          <div key={index} className="px-5 flex flex-col items-center justify-center md:p-10 gap-4">
            <h2 className="font-semibold md:text-2xl">{counter.counterName}</h2>
            <Card className="ml-4 w-[160px] rounded-none">
            <Card shadow='none' className="w-full mb-5 rounded-none">
              <CardBody className='text-center font-semibold text-xl bg-[#6236F5] text-white'>
                Now Serving
                </CardBody>
              </Card>
              <h3 className="text-center font-semibold text-6xl">{counter.tokens[0] ? counter.tokens[0] : '-'}</h3>
              <Card shadow='none' className="w-full mt-5 mb-5 rounded-none">
              <CardBody className='text-center font-semibold text-xl bg-[#6236F5] text-white'>
                Next Token
                </CardBody>
              </Card>
              <h3 className="text-center font-semibold text-5xl mb-4">{counter.tokens[1] ? counter.tokens[1] : '-'}</h3>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
