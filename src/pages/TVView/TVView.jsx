import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardBody } from "@nextui-org/react";
import { collection, onSnapshot, getDocs, doc, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../services/firebase";
import {Table, TableHeader, TableColumn, TableBody, TableRow, TableCell} from "@nextui-org/react";
import AutomaticSlideshow from "../Admin/AutomaticSlideshow"; 
import { playSound } from '../../PlaySound';
import { debounce } from 'lodash'; 


// LiveClock component
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


// Main component
const UserForm = () => {
  const [countersData, setCountersData] = useState([]);
  const [nowServingData, setNowServingData] = useState({});
  const [refresh, setRefresh] = useState(false);
  const [recalledMessage, setRecalledMessage] = useState(null);
  const lastPlayedTokens = useRef({});
  const handleRecallRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const debouncedPlaySound = useCallback(
    debounce((message) => {
      setIsPlaying(true);
      playSound(message)
        .then(() => {
          setIsPlaying(false);
        })
        .catch((error) => {
          console.error('Error playing sound:', error);
          setIsPlaying(false);
        });
    }, 300),
    []
  );

  const SpeakerIcon = ({ isPlaying }) => (
    <div className="fixed top-4 right-4 p-2 bg-white rounded-full shadow-lg">
      <div className={`relative w-8 h-8 ${isPlaying ? 'text-blue-500' : 'text-gray-600'}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-full h-full ${isPlaying ? 'animate-pulse' : ''}`}
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {isPlaying && (
            <>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
  

  useEffect(() => {
    const countersRef = collection(db, 'counters');
    const q = query(countersRef, orderBy('lastUpdated', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedCounters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCountersData(updatedCounters);

      // Set up listeners for each counter's nowServing data
      updatedCounters.forEach(counter => {
        const nowServingDocRef = doc(db, `counter${counter.counterName.split(' ')[1]}`, 'counterDoc');
        onSnapshot(nowServingDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const newToken = docSnapshot.data().nowServingToken || "-";
            setNowServingData(prev => {
              const oldToken = prev[counter.id];
              if (oldToken !== newToken) {
                if (newToken !== "-") {
                  lastPlayedTokens.current[counter.id] = newToken;
                  debouncedPlaySound(`Token number ${newToken} please proceed to ${counter.counterName}`);
                } else {
                  // Update the old token with '-' when the new token is '-'
                  lastPlayedTokens.current[counter.id] = "-";
                }
              }
              return { ...prev, [counter.id]: newToken };
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


    return () => {
      unsubscribe();
      debouncedPlaySound.cancel();
    };
  }, [debouncedPlaySound]);


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
      
      <div className="flex flex-col md:flex-row p-4 space-y-4 md:space-y-0 md:space-x-4 mt-10">
        <div className="md:w-1/2">
          <Card className="h-full">
            <CardBody className="p-0">
              <MemoizedSlideshow refresh={refresh} setRefresh={setRefresh} />
            </CardBody>
          </Card>
        </div>
        <SpeakerIcon isPlaying={isPlaying} className="mb-10"/>
        <div className="md:w-1/2 space-y-4">
          <LiveClock />
          <Card>
            <CardBody>
              {tableContent}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};



export default UserForm;