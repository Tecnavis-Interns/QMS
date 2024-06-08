import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@nextui-org/react";
import { collection, onSnapshot,getDocs } from "firebase/firestore"; // Import onSnapshot
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import React from "react";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, User, Chip, Tooltip, getKeyValue} from "@nextui-org/react";
import AutomaticSlideshow from "../Admin/AutomaticSlideshow"; 
export default function UserForm() {
  const auth = getAuth();
  const [countersData, setCountersData] = useState([]);
  const [currentServingTokens, setCurrentServingTokens] = useState({});
  const [nextTokens, setNextTokens] = useState({});
  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = () => {
      try {
        const counterNames = ["Counter 1", "Counter 2", "Counter 3", "Counter 4", "Counter 5"];
        const tempCountersData = []; // Temporary array to accumulate counters data
        const promises = counterNames.map(async (counterName) => {
          const counterRef = collection(db, counterName);
          const querySnapshot = await getDocs(counterRef);
          const counterTokens = querySnapshot.docs.map((doc) => doc.data().token);
          tempCountersData.push({ counterName, tokens: counterTokens });
        });
        Promise.all(promises).then(() => {
          setCountersData(tempCountersData); // Update state with accumulated counters data
        });
      } catch (error) {
        console.error("Error fetching counters: ", error);
      }
    };

    fetchData();
  }, []); // Empty dependency array to run only once

  useEffect(() => {
    const fetchCurrentServingTokens = () => {
      try {
        if (!user) {
          console.log("User not authenticated");
          return;
        }

        const email = user.email;
        const servingTokens = {};
        const nextTokens = {};

        const fetchTokens = async (counterData) => {
          const counterNumber = parseInt(counterData.counterName.split(" ")[1]); // Extract counter number from counter name
          const servingCollectionName = `CurrentlyServingCounter${counterNumber}`;
          const nextTokenCollectionName = `nextTokenCounter${counterNumber}`;

          const servingRef = collection(db, servingCollectionName);
          onSnapshot(servingRef, (querySnapshot) => {
            servingTokens[counterData.counterName] = !querySnapshot.empty
              ? querySnapshot.docs[0].data().token
              : null;
            setCurrentServingTokens({ ...servingTokens }); // Update currentServingTokens state with new data
          });

          const nextTokenRef = collection(db, nextTokenCollectionName);
          onSnapshot(nextTokenRef, (querySnapshot) => {
            nextTokens[counterData.counterName] = !querySnapshot.empty
              ? querySnapshot.docs[0].data().token
              : null;
            setNextTokens({ ...nextTokens }); // Update nextTokens state with new data
          });
        };

        countersData.forEach((counterData) => {
          fetchTokens(counterData);
        });
      } catch (error) {
        console.error("Error fetching tokens: ", error);
      }
    };

    fetchCurrentServingTokens();
  }, [user, countersData]);
  const [currentDateTime, setCurrentDateTime] = useState('');
  useEffect(() => {
    const getCurrentDateTime = () => {
      const dateTime = new Date();
      const formattedDateTime = dateTime.toLocaleString(); 
      return formattedDateTime;
    };

    setCurrentDateTime(getCurrentDateTime());
  }, []);

  
  return (
    <div className="flex flex-col  min-h-dvh">
    <div className="flex">
    <div className="flex flex-col justify-center min-dvh w-[600px] ">
    <Card className="py-4 h-[660px]">
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-between">
       
      </CardHeader>
      <CardBody className="overflow-visible justify-center flex flex-col items-center py-2">
      <div className="w-full h-full ">
            <AutomaticSlideshow />
          </div>
      </CardBody>
    </Card>
   </div>
   
  <div className="flex flex-col justify-center min-h-dvh w-1/2 mx-auto ">
  <div className="mb-4 mt-4  justify-center text-center">
      <h4 className="font-semibold md:text-2xl">{currentDateTime}</h4>
    </div>
    <Table isStriped aria-label="Example static collection table">
      <TableHeader>
        <TableColumn><h2 className="font-semibold md:text-4xl">COUNTER</h2></TableColumn>
        <TableColumn><h2 className="font-semibold item-center md:text-4xl">TOKEN NUMBER</h2></TableColumn>
      </TableHeader>
      <TableBody>
        {countersData.map((counter, index) => (
          <TableRow key={index}>
            <TableCell><h2 className="font-semibold md:text-4xl">{counter.counterName}</h2></TableCell>
            <TableCell><h3 className="text-center font-semibold text-6xl">{currentServingTokens[counter.counterName] || "-"}</h3>
        </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
</div>

</div>
  );

}