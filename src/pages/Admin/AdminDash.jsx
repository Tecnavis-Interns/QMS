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
import TokenChart from "../chart/tokenChart";
import { db } from '../../services/firebase';
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
      return updatedRequests.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
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
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white w-full sm:w-1/2 md:w-1/4 rounded-lg shadow-md p-4">
          <p className="text-gray-600">{currentTime}</p>
        </div>
      </div>
  
      {/* Main Cards */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
          {counterData.map((counter) => (
            <div key={counter.id} className="flex-shrink-0 w-48 sm:w-56 cursor-pointer">
              <div className="bg-indigo-200 h-24 rounded-xl p-3 mb-2 relative z-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-lg font-bold">
                      {counter.completed} <span className="text-sm opacity-60 font-normal">Completed</span>
                    </h1>
                  </div>
                  <div>
                    <h1 className={`text-xs font-medium px-2 py-1 rounded ${
                      counter.active ? 'bg-green-300 text-green-900' : 'bg-red-400 text-white'
                    }`}>
                      {counter.active ? 'Active' : 'Closed'}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="bg-slate-100 rounded-xl p-3 -mt-6 pt-8 relative z-10 h-24">
                <div className="flex flex-col">
                  <h1 className="font-bold text-sm">{counter.counterName}</h1>
                  <h1 className="text-sm">{counter.service}</h1>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
  
      {/* Cards, Charts, Queue Details, and Staff */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-red-100 h-24 text-center rounded-lg px-4 py-3">
                <p className="text-xl font-semibold text-red-700">COMPLETED</p>
                <p className="mt-1 text-sm text-gray-500">{completedCount}</p>
              </div>
              <div className="bg-yellow-100 h-24 text-center rounded-lg px-4 py-3">
                <p className="text-xl font-semibold text-yellow-700">PENDING</p>
                <p className="mt-1 text-sm text-gray-500">{pendingCount}</p>
              </div>
              <div className="bg-green-100 h-24 text-center rounded-lg px-4 py-3">
                <p className="text-xl font-semibold text-green-700">REMAINING</p>
                <p className="mt-1 text-sm text-gray-500">{remainingCount}</p>
              </div>
            </div>
            
            {/* Queue Details */}
            <div>
              <h1 className="text-xl font-semibold mb-4">Queue Details</h1>
              <div className="overflow-x-auto">
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
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                            request.transfer 
                              ? 'bg-blue-300 text-blue-900'
                              : request.pending
                                ? 'bg-orange-400 text-orange-900'
                                : 'bg-green-300 text-green-900'
                          }`}>
                            {request.transfer 
                              ? 'Transferred' 
                              : request.pending
                                ? 'Pending'
                                : 'In Queue'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          
          {/* Token Chart and Current Staff */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-4">
              <TokenChart />
            </div>
            <div className="bg-white shadow-md rounded-xl p-4">
              <h1 className="text-xl font-semibold mb-4">Current Staff</h1>
              {staffMembers.map((staff) => (
                <div key={staff.id} className="flex items-center mb-4">
                  <img
                    className="w-10 h-10 rounded-full mr-4"
                    src={staff.imageUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXQIhCa4OVtg6VpVOpw2kHHByhxVyj29trOw&usqp=CAU"}
                    alt={`${staff.staffName} profile`}
                  />
                  <div>
                    <h2 className="font-semibold">{staff.staffName}</h2>
                    <p className="text-sm text-gray-600">{staff.role || 'Staff Member'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};  

export default Dashboard;