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
import Navbar from "../Components/Navbar";
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
      <Navbar />
      <div className="flex flex-1 justify-center flex-wrap lg:mx-10">
        {countersData.map((counter, index) => (
          <div key={index} className="px-5 flex flex-col items-center justify-center md:p-10 gap-4">
            <h2 className="font-semibold md:text-2xl">{counter.counterName}</h2>
            <Card shadow='none' className="w-full"><CardBody className='text-center font-semibold text-xl'>{counter.tokens.length > 0 ? `Now Serving: ${counter.tokens[0]}` : "No tokens"}</CardBody></Card>
            <div className="overflow-auto w-full md:min-h-64 md:max-h-64">
              <Table aria-label={`Counter ${index + 1} tokens`} isHeaderSticky removeWrapper>
                <TableHeader>
                  <TableColumn className="text-2xl bg-[#6236F5] text-white text-center">Next Tokens</TableColumn>
                </TableHeader>
                <TableBody>
                  {counter.tokens.map((token, tokenIndex) => (
                    <TableRow key={tokenIndex}>
                      <TableCell className="text-xl text-center">{token}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
