import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@nextui-org/react";
import { collection, onSnapshot, getDocs, doc } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import React from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@nextui-org/react";
import AutomaticSlideshow from "../Admin/AutomaticSlideshow"; 

const LiveClock = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="mb-6 mt-4 flex flex-col items-center justify-center text-center bg-gradient-to-r from-purple-500 to-indigo-600 p-4 rounded-lg shadow-lg">
      <h4 className="font-bold text-3xl md:text-4xl text-white mb-2">
        {formatTime(currentDateTime)}
      </h4>
      <p className="text-lg md:text-xl text-gray-200">
        {formatDate(currentDateTime)}
      </p>
    </div>
  );
};

export default function UserForm() {
  const auth = getAuth();
  const [countersData, setCountersData] = useState([]);
  const [currentServingTokens, setCurrentServingTokens] = useState({});
  const user = auth.currentUser;
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const counterNames = ["Counter 1", "Counter 2", "Counter 3", "Counter 4", "Counter 5"];
        const tempCountersData = await Promise.all(counterNames.map(async (counterName) => {
          const counterRef = collection(db, counterName);
          const querySnapshot = await getDocs(counterRef);
          const counterTokens = querySnapshot.docs.map((doc) => doc.data().token);
          return { counterName, tokens: counterTokens };
        }));
        setCountersData(tempCountersData);
      } catch (error) {
        console.error("Error fetching counters: ", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchCurrentServingTokens = () => {
      countersData.forEach((counterData) => {
        const counterNumber = parseInt(counterData.counterName.split(" ")[1]);
        const counterDocRef = doc(db, `counter${counterNumber}`, 'counterDoc');
  
        onSnapshot(counterDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setCurrentServingTokens(prev => ({
              ...prev,
              [counterData.counterName]: data.nowServingToken || "-"
            }));
          } else {
            setCurrentServingTokens(prev => ({
              ...prev,
              [counterData.counterName]: "-"
            }));
          }
        });
      });
    };
  
    fetchCurrentServingTokens();
  }, [countersData]);

  useEffect(() => {
    console.log("Refresh state changed:", refresh);
  }, [refresh]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 justify-center">
      <div className="flex flex-col md:flex-row p-4 space-y-4 md:space-y-0 md:space-x-4">
        <div className="md:w-1/2">
          <Card className="h-full">
            <CardBody className="p-0">
              <AutomaticSlideshow refresh={refresh} setRefresh={setRefresh} />
            </CardBody>
          </Card>
        </div>
        <div className="md:w-1/2 space-y-4">
          <LiveClock />
          <Card>
            <CardBody>
              <Table 
                aria-label="Counter tokens table"
                className="text-center"
                shadow="none"
              >
                <TableHeader>
                  <TableColumn><h2 className="font-bold text-2xl md:text-3xl">COUNTER</h2></TableColumn>
                  <TableColumn><h2 className="font-bold text-2xl md:text-3xl">TOKEN NUMBER</h2></TableColumn>
                </TableHeader>
                <TableBody>
                  {countersData.map((counter, index) => (
                    <TableRow key={index}>
                      <TableCell><h3 className="font-semibold text-xl md:text-2xl">{counter.counterName}</h3></TableCell>
                      <TableCell>
                        <h3 className="font-bold text-3xl md:text-4xl text-indigo-600">
                          {currentServingTokens[counter.counterName] || "-"}
                        </h3>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}