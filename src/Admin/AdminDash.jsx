import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import moment from "moment";
import "./Dashboard.css";

import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import TokenChart from "../../src/tokenChart";
import { db } from '../firebase';
import { collection, query, where, getDocs, getDoc, doc, onSnapshot } from 'firebase/firestore';

const Dashboard = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [remainingCount, setRemainingCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(
    moment().format("MMMM Do YYYY, h:mm:ss a")
  );
  const [counterData, setCounterData] = useState([]);

  useEffect(() => {
    const checkAuth = () => {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      console.log('Current user:', user);
      if (!user || user.role !== 'admin') {
        console.log('Redirecting to login');
        navigate('/login');
      } else {
        console.log('Admin authenticated');
      }
    };

    checkAuth();
    const unsubscribeRequests = setupRequestsListener();
    const unsubscribeStaff = setupStaffListener();
    const unsubscribeQueue = setupQueueListener();
    const unsubscribeCounters = setupCountersListener();

    // Clean up listeners on component unmount
    return () => {
      unsubscribeRequests();
      unsubscribeStaff();
      unsubscribeQueue();
      unsubscribeCounters();
    };
  }, [navigate]);

  const setupRequestsListener = () => {
    const transferredQuery = query(collection(db, "requests"), where("transfer", "==", true));
    const activeQuery = query(collection(db, "requests"), where("status", "==", true));

    const unsubscribeTransferred = onSnapshot(transferredQuery, (snapshot) => {
      const transferredRequests = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      updateRequests(transferredRequests, true);
    });

    const unsubscribeActive = onSnapshot(activeQuery, (snapshot) => {
      const activeRequests = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      updateRequests(activeRequests, false);
    });

    return () => {
      unsubscribeTransferred();
      unsubscribeActive();
    };
  };

  const updateRequests = (newRequests, isTransferred) => {
    setRequests(prevRequests => {
      const updatedRequests = isTransferred
        ? [...newRequests, ...prevRequests.filter(req => !req.transfer)]
        : [...prevRequests.filter(req => req.transfer), ...newRequests.filter(req => !req.transfer)];
      return updatedRequests;
    });
  };

  const setupStaffListener = () => {
    const staffQuery = query(collection(db, "staff"), where("active", "==", true));
    return onSnapshot(staffQuery, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      setStaffMembers(staffData);
    });
  };

  const setupQueueListener = () => {
    const queueDocRef = doc(db, "queue", "queueDoc");
    return onSnapshot(queueDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const queueData = docSnap.data();
        setCompletedCount(queueData.receivedToken?.length || 0);
        setPendingCount(queueData.pending?.length || 0);
        setRemainingCount(queueData.token?.length || 0);
      }
    });
  };

  const setupCountersListener = () => {
    const countersQuery = query(collection(db, "counters"));
    return onSnapshot(countersQuery, (snapshot) => {
      const countersData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      setCounterData(countersData);
    });
  };
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("MMMM Do YYYY, h:mm:ss a"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Header Section */}
      <div className="flex ml-4 mt-6 sm:ml-8 lg:ml-14">
        <div className="bg-white w-full sm:w-1/2 md:w-1/4 rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <p className="text-gray-600">{currentTime}</p>
        </div>
      </div>
  
      {/* Main Cards */}
      <div className="mt-6 mb-6">
        <div className="flex space-x-4 sm:space-x-8 px-4 sm:px-8 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style jsx>{`
            .flex::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {counterData.map((counter) => (
            <div key={counter.id} className="flex-shrink-0 w-[160px] sm:w-[200px] cursor-pointer">
              <div className="bg-indigo-200 h-20 rounded-xl p-2 sm:p-3 mb-2 w-full mx-auto relative z-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-sm sm:text-lg font-bold">
                      {counter.completed} <span className="text-xs sm:text-sm opacity-60 font-normal">Completed</span>
                    </h1>
                  </div>
                  <div>
                    <h1 className={`text-xs sm:text-sm font-medium px-2 py-0.5 rounded ${
                      counter.active ? 'bg-green-300 text-green-900' : 'bg-red-400 text-white'
                    }`}>
                      {counter.active ? 'Active' : 'Closed'}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="bg-slate-100 rounded-xl p-2 sm:p-3 -mt-6 pt-6 sm:pt-8 relative z-10">
                <div className="flex items-center mb-1 sm:mb-2">
                  <div className="flex flex-col">
                    <h1 className="font-bold text-xs sm:text-sm">{counter.counterName}</h1>
                    <h1 className=" text-xs sm:text-sm">{counter.service}</h1>
                  </div>
                </div>
                <div className="border-t pt-1 sm:pt-2">
                  {/* Optional section */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
  
      {/* Cards & Charts */}
      <div className="flex flex-col sm:flex-row w-full pt-8">
        <div className="grid w-full sm:w-3/5 ml-4 sm:ml-16 sm:-mt-7 grid-cols-1 sm:grid-cols-3 gap-4 mb-4 sm:mb-0">
          <div className="bg-red-100 h-24 text-center rounded-lg px-4 py-3 sm:py-5">
            <p className="text-lg sm:text-xl font-semibold text-red-700">COMPLETED</p>
            <p className="mt-1 text-sm text-gray-500">{completedCount}</p>
          </div>
          <div className="bg-yellow-100 h-24 text-center rounded-lg px-4 py-3 sm:py-5">
            <p className="text-lg sm:text-xl font-semibold text-yellow-700">PENDING</p>
            <p className="mt-1 text-sm text-gray-500">{pendingCount}</p>
          </div>
          <div className="bg-green-100 h-24 text-center rounded-lg px-4 py-3 sm:py-5">
            <p className="text-lg sm:text-xl font-semibold text-green-700">REMAINING</p>
            <p className="mt-1 text-sm text-gray-500">{remainingCount}</p>
          </div>
        </div>
        <div className="w-full sm:w-1/3 ml-4 sm:ml-8 -mt-4 sm:-mt-14">
          <TokenChart />
        </div>
      </div>
  
      {/* Queue List & Staff */}
      <div className="flex flex-col sm:flex-row h-auto sm:h-[400px] -mt-40 -ml-4 -mr-4 ">
        <div className="w-full sm:w-[700px] ml-4 sm:ml-14  sm:-mt-20 p-4">
          <h1 className="text-xl py-2 px-3">Queue Details</h1>
          <Table aria-label="Queue Details">
            <TableHeader>
              <TableColumn>Sl. no.</TableColumn>
              <TableColumn>Name</TableColumn>
              <TableColumn>Date</TableColumn>
              <TableColumn>Service</TableColumn>
              <TableColumn>Status</TableColumn>
            </TableHeader>
            <TableBody>
              {requests.map((request, index) => (
                <TableRow key={request.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{request.name}</TableCell>
                  <TableCell>{request.date && request.date.toDate ? moment(request.date.toDate()).format('DD/MM/YYYY') : 'N/A'}</TableCell>
                  <TableCell>{request.service}</TableCell>
                  <TableCell>
                    <h1 className={`text-xs font-medium me-2 pr-2 px-2.5 py-0.5 rounded ${
                      request.transfer 
                        ? 'bg-blue-300 text-blue-900 dark:bg-blue-900 dark:text-blue-300'
                        : request.pending
                          ? 'bg-orange-400 text-orange-900 dark:bg-orange-900 dark:text-orange-700'
                          : 'bg-green-300 text-green-900 dark:bg-green-900 dark:text-green-700'
                    }`}>
                      {request.transfer 
                        ? 'Transferred' 
                        : request.pending
                          ? 'Pending'
                          : 'In Queue'}
                    </h1>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </div>
        <div className="flex justify-end -mt-60 mr-2">
        <div className="bg-white shadow-2xl h-auto sm:h-72 sm:mt-13 mr-2 sm:ml-22 rounded-xl w-full sm:w-[335px] overflow-y-auto">
          <h1 className="py-2 px-5">Current Staff</h1>
          {staffMembers.map((staff) => (
            <div key={staff.id} className="flex mt-2">
              <img
                className="w-8 h-8 rounded-full ml-2 sm:ml-4"
                src={staff.imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"}
                alt={`${staff.staffName} profile`}
              />
              <div className="ml-2 sm:ml-4">
                <h2 className="font-sans font-semibold text-sm sm:text-base py-1">{staff.staffName}</h2>
                <p className="font-sans text-xs sm:text-sm">{staff.role || 'Staff Member'}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
    </>
  );
};  

export default Dashboard;