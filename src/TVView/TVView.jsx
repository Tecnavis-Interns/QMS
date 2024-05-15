import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody
} from "@nextui-org/react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";

export default function UserForm() {
  const auth = getAuth();
  const [countersData, setCountersData] = useState([]);
  const [currentServingTokens, setCurrentServingTokens] = useState({});
  const user = auth.currentUser;

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

  useEffect(() => {
    const fetchCurrentServingTokens = async () => {
      try {
        if (!user) {
          console.log("User not authenticated");
          return;
        }

        const email = user.email;
        const servingTokens = {};

        for (const counterData of countersData) {
          const counterNumber = parseInt(counterData.counterName.split(" ")[1]); // Extract counter number from counter name
          const servingCollectionName = `CurrentlyServingCounter${counterNumber}`;
          const querySnapshot = await getDocs(collection(db, servingCollectionName));
          if (!querySnapshot.empty) {
            servingTokens[counterData.counterName] = querySnapshot.docs[0].data().token;
          } else {
            servingTokens[counterData.counterName] = null;
          }
        }
        setCurrentServingTokens(servingTokens);
      } catch (error) {
        console.error("Error fetching currently serving tokens: ", error);
      }
    };

    fetchCurrentServingTokens();
  }, [user, countersData]);

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex flex-1 justify-center flex-wrap lg:mx-10">
        {countersData.map((counter, index) => (
          <div key={index} className="px-5 flex flex-col items-center justify-center md:p-5 gap-4">
            <Card className="py-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-between">
                <h1 className="font-semibold md:text-4xl">{counter.counterName}</h1>
              </CardHeader>
              <CardBody className="overflow-visible justify-between py-2">
                <Card className=" w-[190px]   rounded-md">
                  <Card shadow='none' className="w-full mb-5 rounded-none">
                    <CardBody className='text-center font-semibold text-xl bg-[#6236F5] text-white'>
                      Now Serving
                    </CardBody>
                  </Card>
                  <h3 className="text-center font-semibold text-6xl">{currentServingTokens[counter.counterName]}</h3>
                  <Card shadow='none' className="w-full mt-5 mb-5 rounded-none">
                    <CardBody className='text-center font-semibold text-xl bg-[#6236F5] text-white'>
                      Next Token
                    </CardBody>
                  </Card>
                  <h3 className="text-center font-semibold text-5xl mb-4">{counter.tokens[0] ? counter.tokens[0] : '-'}</h3>
                </Card>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
