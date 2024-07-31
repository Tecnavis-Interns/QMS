import React, { useState, useEffect, useMemo,useCallback } from 'react';
import { Card, CardBody } from "@nextui-org/react";
import { collection, onSnapshot, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@nextui-org/react";
import AutomaticSlideshow from "../Admin/AutomaticSlideshow"; 
import { speak } from './speech';  // Keep this import

const LiveClock = React.memo(() => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = useCallback((date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  }, []);

  const formatTime = useCallback((date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }, []);

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
});

const MemoizedSlideshow = React.memo(AutomaticSlideshow);

export const CustomEventEmitter = {
  events: {},
  dispatch: function(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  },
  subscribe: function(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  },
  unsubscribe: function(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
};

export default function UserForm() {
  const [countersData, setCountersData] = useState([]);
  const [nowServingData, setNowServingData] = useState({});
  const [refresh, setRefresh] = useState(false);
  const [lastRecalledToken, setLastRecalledToken] = useState(null);

  useEffect(() => {
    const countersRef = collection(db, 'counters');
    const q = query(countersRef, orderBy('lastUpdated', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedCounters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCountersData(updatedCounters);

      updatedCounters.forEach(counter => {
        const nowServingDocRef = doc(db, `counter${counter.counterName.split(' ')[1]}`, 'counterDoc');
        onSnapshot(nowServingDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const newToken = docSnapshot.data().nowServingToken || "-";
            setNowServingData(prev => {
              if (prev[counter.id] !== newToken) {
                if (newToken !== "-") {
                  const message = `Token number ${newToken}, please proceed to counter ${counter.counterName.split(' ')[1]}`;
                  speak(message);
                }
                return { ...prev, [counter.id]: newToken };
              }
              return prev;
            });
            setCountersData(prevCounters => {
              const updatedCounter = prevCounters.find(c => c.id === counter.id);
              const remainingCounters = prevCounters.filter(c => c.id !== counter.id);
              return [updatedCounter, ...remainingCounters];
            });
          }
        });
      });
    });

    const recallSpecificToken = ({ tokenNumber, counterNumber }) => {
      const message = `Recalling Token number ${tokenNumber}, please proceed to counter ${counterNumber}`;
      console.log("New token recall:", message);
      speak(message);
      setLastRecalledToken({ tokenNumber, counterNumber });
    };

    CustomEventEmitter.subscribe('tokenRecall', recallSpecificToken);

    return () => {
      unsubscribe();
      CustomEventEmitter.unsubscribe('tokenRecall', recallSpecificToken);
    };
  }, []);

  const tableContent = useMemo(() => (
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
        {countersData.slice(0, 5).map((counter) => (
          <TableRow key={counter.id}>
            <TableCell><h3 className="font-semibold text-xl md:text-2xl">{counter.counterName}</h3></TableCell>
            <TableCell>
              <h3 className="font-bold text-3xl md:text-4xl text-indigo-600">
                {nowServingData[counter.id] || "-"}
              </h3>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ), [countersData, nowServingData]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 justify-center">
      <div className="flex flex-col md:flex-row p-4 space-y-4 md:space-y-0 md:space-x-4">
        <div className="md:w-1/2">
          <Card className="h-full">
            <CardBody className="p-0">
              <MemoizedSlideshow refresh={refresh} setRefresh={setRefresh} />
            </CardBody>
          </Card>
        </div>
        <div className="md:w-1/2 space-y-4">
          <LiveClock />
          <Card>
            <CardBody>
              {tableContent}
            </CardBody>
          </Card>
          {lastRecalledToken && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
              <p className="font-bold">Last Recalled Token</p>
              <p>Token {lastRecalledToken.tokenNumber} to Counter {lastRecalledToken.counterNumber}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}